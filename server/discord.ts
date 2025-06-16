
import RPC, { Channel, Subscription } from '@ankziety/discord-rpc';
import { DeskThing } from 'deskthing-server';

interface UserData {
  id: string;
  username: string;
  nick?: string;
  speaking: boolean;
  volume?: number;
  mute: boolean;
  deaf: boolean;
  avatar: string;
  profile?: string;
}

interface UserVoiceState {
  id: string;
  mute?: boolean;
  deaf?: boolean;
  volume?: number;
}

interface DiscordData {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  nick?: string;
  volume?: number;
  voice_state?: {
    mute: boolean;
    deaf: boolean;
    self_mute: boolean;
    self_deaf: boolean;
  };
  state?: string;
}

type Subscriptions = {
  voice: { [key: string]: Subscription[] };
};

class DiscordHandler {
  private DeskThingServer: DeskThing;
  private rpc: RPC.Client = new RPC.Client({ transport: 'ipc' });
  private subscriptions: Subscriptions = { voice: {} };
  private startTimestamp: Date | null = null;
  private redirect_url: string;
  private scopes: string[];
  private client_id: string | undefined = undefined;
  private client_secret: string | undefined = undefined;
  private token: string | undefined = undefined;
  private connectedUserList: UserData[] = [];
  private selectedChannel: Channel | null = null;
  private recentChannels: Channel[] = [];

  constructor(DeskThing: DeskThing) {
    this.DeskThingServer = DeskThing;
    this.redirect_url = 'http://localhost:8888/callback/discord';
    this.scopes = [
      'rpc',
      'rpc.voice.read',
      'rpc.activities.write',
      'rpc.voice.write',
      'rpc.notifications.read',
      'messages.read',
    ];
  }

  async registerRPC() {
    try {
      this.DeskThingServer.sendLog('Registering RPC over IPC and logging in...');
      const data = await this.DeskThingServer.getData();
      if (data) {
        this.client_id = data.client_id as string;
        this.client_secret = data.client_secret as string;
        this.token = data.token as string;
      }

      if (!this.client_id || !this.client_secret) {
        this.DeskThingServer.sendError('Missing client ID or secret');
        throw new Error('Missing client ID or secret');
      }

      RPC.register(this.client_id);
      await this.unsubscribe();
      this.subscriptions = { voice: {} };
      await this.initializeRpc();
      await this.login();
    } catch (exception) {
      this.DeskThingServer.sendError(`RPC: Error registering RPC client: ${exception}`);
    }
  }

  async login() {
    try {
      if (!this.client_id || !this.client_secret) return;

      await this.rpc.connect(this.client_id);

      if (!this.token) {
        this.token = await this.rpc.authorize({
          scopes: this.scopes,
          clientSecret: this.client_secret,
          redirectUri: this.redirect_url,
        });
        this.DeskThingServer.saveData({ token: this.token });
      }

      await this.rpc.login({
        scopes: this.scopes,
        clientId: this.client_id,
        clientSecret: this.client_secret,
        redirectUri: this.redirect_url,
        accessToken: this.token,
      });

      this.DeskThingServer.sendLog('RPC: Auth Successful');
    } catch (exception) {
      this.DeskThingServer.sendError(`Discord RPC Error: ${exception}`);
    }
  }

  async initializeRpc() {
    this.DeskThingServer.sendLog('RPC Initializing...');
    try {
      this.rpc.on('ready', async () => {
        this.DeskThingServer.sendLog('RPC ready! Setting activity and subscribing to events');
        
        // Send initial profile data to client
        this.sendProfileData();
        
        const setActivity = (await this.DeskThingServer.getData())?.settings?.activity?.value;
        if (setActivity) {
          await this.setActivity();
        }
        
        this.setSubscribe();
      });

      this.rpc.on('VOICE_STATE_CREATE', async (args) => {
        await this.handleVoiceStateCreate(args);
      });

      this.rpc.on('VOICE_STATE_DELETE', async (args) => {
        await this.handleVoiceStateDelete(args);
      });

      this.rpc.on('VOICE_STATE_UPDATE', async (args) => {
        await this.handleVoiceStateUpdate(args);
      });

      this.rpc.on('SPEAKING_START', async (args) => {
        await this.handleSpeakingStart(args);
      });

      this.rpc.on('SPEAKING_STOP', async (args) => {
        await this.handleSpeakingStop(args);
      });

      this.rpc.on('VOICE_CONNECTION_STATUS', async (args) => {
        await this.handleVoiceConnectionStatus(args);
      });

      this.rpc.on('ACTIVITY_JOIN', async (args) => {
        this.DeskThingServer.sendLog(`Activity join: ${JSON.stringify(args)}`);
      });

      this.rpc.on('error', (error) => {
        this.DeskThingServer.sendError(`RPC Error: ${error.message}`);
      });

      this.rpc.on('disconnected', async (closeEvent) => {
        this.DeskThingServer.sendError(`Disconnected from Discord: ${closeEvent}`);
        await this.login();
      });

      this.DeskThingServer.sendLog('RPC events setup!');
    } catch (ex) {
      this.DeskThingServer.sendError(`RPC: Error initializing RPC: ${ex}`);
    }
  }

  async sendProfileData() {
    if (!this.rpc.user) {
      this.DeskThingServer.sendLog('No user data available yet');
      return;
    }

    const profileData = {
      user: {
        id: this.rpc.user.id,
        username: this.rpc.user.username,
        discriminator: this.rpc.user.discriminator,
        avatar: this.rpc.user.avatar,
        global_name: this.rpc.user.global_name,
        banner: this.rpc.user.banner,
        bio: null, // RPC doesn't provide bio
      },
      status: 'online',
      activities: [],
      avatar_url: this.rpc.user.avatar 
        ? `https://cdn.discordapp.com/avatars/${this.rpc.user.id}/${this.rpc.user.avatar}.png?size=256`
        : null,
      custom_status: null,
      connections: [],
    };

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'profile_data',
      payload: profileData,
    });
  }

  async mergeUserData(newUser: UserData) {
    let existingUserIndex = this.connectedUserList.findIndex(
      (user) => user.id === newUser.id
    );

    if (existingUserIndex !== -1) {
      this.connectedUserList[existingUserIndex] = {
        ...this.connectedUserList[existingUserIndex],
        ...newUser,
      };
    } else {
      existingUserIndex = this.connectedUserList.push(newUser) - 1;
    }

    this.connectedUserList[existingUserIndex].profile =
      await this.fetchUserProfilePicture(newUser);

    return this.connectedUserList[existingUserIndex];
  }

  async fetchUserProfilePicture(user: UserData) {
    try {
      const pfp = await this.DeskThingServer.encodeImageFromUrl(
        `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      );
      return pfp;
    } catch (error) {
      this.DeskThingServer.sendLog(`Failed to fetch profile picture for ${user.username}: ${error}`);
      return undefined;
    }
  }

  async handleVoiceStateCreate(args: DiscordData) {
    this.DeskThingServer.sendLog(`Voice State Create: ${args.user.username} joined`);
    
    const userData: UserData = {
      id: args.user.id,
      username: args.user.username,
      nick: args.nick,
      speaking: false,
      volume: args.volume,
      mute: args.voice_state?.mute || args.voice_state?.self_mute || false,
      deaf: args.voice_state?.deaf || args.voice_state?.self_deaf || false,
      avatar: args.user.avatar,
      profile: undefined,
    };

    const mergedUser = await this.mergeUserData(userData);
    
    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'channel_member',
      request: 'connect',
      payload: mergedUser,
    });
  }

  async handleVoiceStateDelete(args: DiscordData) {
    this.DeskThingServer.sendLog(`Voice State Delete: ${args.user.username} left`);

    this.connectedUserList = this.connectedUserList.filter(
      (user) => user.id !== args.user.id
    );

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'channel_member',
      request: 'disconnect',
      payload: { id: args.user.id },
    });
  }

  async handleVoiceStateUpdate(args: DiscordData) {
    const userData: UserData = {
      id: args.user.id,
      username: args.user.username,
      nick: args.nick,
      speaking: false,
      volume: args.volume,
      mute: args.voice_state?.mute || args.voice_state?.self_mute || false,
      deaf: args.voice_state?.deaf || args.voice_state?.self_deaf || false,
      avatar: args.user.avatar,
      profile: undefined,
    };

    await this.mergeUserData(userData);

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'voice_data',
      payload: userData,
    });
  }

  async handleSpeakingStart(args: { user_id: string }) {
    const existingUser = this.connectedUserList.find(
      (user) => user.id === args.user_id
    );
    if (existingUser) {
      existingUser.speaking = true;
      this.DeskThingServer.sendDataToClient({
        app: 'discord',
        payload: { id: args.user_id, speaking: true },
        type: 'speaking_data',
      });
    }
  }

  async handleSpeakingStop(args: { user_id: string }) {
    const existingUser = this.connectedUserList.find(
      (user) => user.id === args.user_id
    );
    if (existingUser) {
      existingUser.speaking = false;
      this.DeskThingServer.sendDataToClient({
        app: 'discord',
        payload: { id: args.user_id, speaking: false },
        type: 'speaking_data',
      });
    }
  }

  async handleVoiceConnectionStatus(args: DiscordData) {
    if (args.state === 'VOICE_CONNECTED' && this.selectedChannel === null) {
      await this.handleClientChannelSelect();
    }
    
    if (args.state === 'VOICE_CONNECTING') {
      const autoSwitchView = (await this.DeskThingServer.getData())?.settings?.auto_switch_view?.value;
      if (autoSwitchView) {
        this.DeskThingServer.sendDataToClient({
          app: 'client',
          type: 'set',
          request: 'view',
          payload: 'Discord',
        });
      }

      this.DeskThingServer.sendDataToClient({
        app: 'discord',
        type: 'client_data',
        request: 'join',
      });

      await this.handleClientChannelSelect();
    } else if (args.state === 'DISCONNECTED') {
      this.DeskThingServer.sendDataToClient({
        app: 'discord',
        type: 'client_data',
        request: 'leave',
      });

      await this.clearSelectedChannel();
      this.subscriptions.voice = {};
      this.connectedUserList = [];
    }
  }

  async setActivity() {
    try {
      if (!this.startTimestamp) {
        this.startTimestamp = new Date();
      }
      
      await this.rpc.setActivity({
        details: 'Discord Profile Pal',
        state: 'Monitoring Discord Status',
        largeImageKey: 'discord_logo',
        largeImageText: 'Discord Profile Pal',
        instance: true,
        buttons: [
          {
            label: 'Check Out DeskThing',
            url: 'https://github.com/ItsRiprod/DeskThing',
          },
        ],
      });
      
      this.DeskThingServer.sendLog('Activity set successfully');
    } catch (ex) {
      this.DeskThingServer.sendError(`Error in setActivity: ${ex}`);
    }
  }

  async setSubscribe() {
    this.DeskThingServer.sendLog('Subscribing to Discord events');
    await this.rpc.subscribe('VOICE_CHANNEL_SELECT', {});
    await this.rpc.subscribe('VOICE_CONNECTION_STATUS', {});
    await this.rpc.subscribe('ACTIVITY_JOIN', {});
  }

  async refreshCallData() {
    this.selectedChannel = await this.rpc.getSelectedChannel();

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'channel_info',
      request: 'channel_banner',
      payload: this.selectedChannel,
    });

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'client_data',
      request: 'refresh_call',
      payload: this.getSelectedChannelUsers(),
    });
  }

  async setClientVoiceSetting(data: any) {
    this.DeskThingServer.sendLog(`Changing voice setting: ${JSON.stringify(data)}`);
    await this.rpc.setVoiceSettings(data);
  }

  async handleClientChannelSelect() {
    const channel = await this.rpc.getSelectedChannel();
    if (!channel) return;

    this.selectedChannel = channel;
    await this.hydrateUsers();

    this.subscriptions.voice[this.selectedChannel.id] = [
      await this.rpc.subscribe('VOICE_STATE_UPDATE', { channel_id: this.selectedChannel.id }),
      await this.rpc.subscribe('VOICE_STATE_CREATE', { channel_id: this.selectedChannel.id }),
      await this.rpc.subscribe('VOICE_STATE_DELETE', { channel_id: this.selectedChannel.id }),
      await this.rpc.subscribe('SPEAKING_START', { channel_id: this.selectedChannel.id }),
      await this.rpc.subscribe('SPEAKING_STOP', { channel_id: this.selectedChannel.id }),
    ];

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'channel_info',
      request: 'channel_banner',
      payload: this.selectedChannel,
    });
  }

  async hydrateUsers() {
    if (this.selectedChannel?.voice_states) {
      for (const voiceState of this.selectedChannel.voice_states) {
        if (voiceState.user) {
          await this.mergeUserData(voiceState.user);
        }
      }
    }
  }

  async clearSelectedChannel() {
    if (this.selectedChannel && this.subscriptions.voice[this.selectedChannel.id]) {
      this.subscriptions.voice[this.selectedChannel.id].forEach((sub) =>
        sub.unsubscribe()
      );
    }
    this.selectedChannel = null;
    this.connectedUserList = [];
  }

  async setUserVoiceState(voice_state: UserVoiceState) {
    this.DeskThingServer.sendLog(`Changing user voice state: ${JSON.stringify(voice_state)}`);
    await this.rpc.setUserVoiceSettings(voice_state.id, voice_state);
  }

  async leaveCall() {
    this.DeskThingServer.sendLog('Leaving voice call...');
    await this.rpc.selectVoiceChannel(null);
  }

  getSelectedChannelUsers() {
    return this.connectedUserList;
  }

  async unsubscribe() {
    try {
      for (const channelId of Object.keys(this.subscriptions.voice)) {
        this.subscriptions.voice[channelId].forEach((sub) => sub.unsubscribe());
      }
    } catch (ex) {
      this.DeskThingServer.sendError(`Error during unsubscribe: ${ex}`);
    }
  }
}

export default DiscordHandler;
