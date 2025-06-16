import RPC from 'discord-rpc';
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

interface Channel {
  id: string;
  name: string;
  voice_states?: any[];
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

type subscriptions = {
  voice: { [key: string]: any[] };
};

class DiscordHandler {
  private DeskThingServer: DeskThing;
  private rpc: any = new RPC.Client({ transport: 'ipc' });
  private subscriptions: subscriptions = { voice: {} };
  private startTimestamp: Date | null;
  private redirect_url: string;
  private scopes: string[];
  private client_id: string | undefined = undefined;
  private client_secret: string | undefined = undefined;
  private token: string | undefined = undefined;
  private connectedUserList: UserData[];
  private selectedChannel: Channel | null = null;
  private recentChannels: Channel[];

  constructor(DeskThing: DeskThing) {
    this.DeskThingServer = DeskThing;
    this.subscriptions = { voice: {} };
    this.startTimestamp = null;
    this.connectedUserList = [];
    this.redirect_url = 'http://localhost:8888/callback/discord';
    this.recentChannels = [];
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

      this.DeskThingServer.sendLog('RPC: @login Auth Successful');
    } catch (exception) {
      this.DeskThingServer.sendError(`Discord RPC Error: ${exception}`);
    }
  }

  async initializeRpc() {
    this.DeskThingServer.sendLog('RPC Initializing...');
    try {
      this.rpc.on('ready', async () => {
        this.DeskThingServer.sendLog('RPC ready! Setting activity and subscribing to events');
        const settings = await this.DeskThingServer.getData();
        const setActivity = settings?.settings?.activity?.value;
        
        if (setActivity) {
          this.DeskThingServer.addBackgroundTaskLoop(async () => {
            this.rpc.clearActivity();
            await this.setActivity();
            this.DeskThingServer.sendLog('Activity was set...');
            await new Promise((resolve) => setTimeout(resolve, 30000));
          });
        } else {
          this.DeskThingServer.sendLog('Not starting Activity due to settings');
        }
        this.setSubscribe();
      });

      this.rpc.on('VOICE_STATE_CREATE', async (args: DiscordData) => {
        await this.handleVoiceStateCreate(args);
      });

      this.rpc.on('VOICE_STATE_DELETE', async (args: DiscordData) => {
        await this.handleVoiceStateDelete(args);
      });

      this.rpc.on('VOICE_STATE_UPDATE', async (args: DiscordData) => {
        await this.handleVoiceStateUpdate(args);
      });

      this.rpc.on('SPEAKING_START', async (args: { user_id: string }) => {
        await this.handleSpeakingStart(args);
      });

      this.rpc.on('SPEAKING_STOP', async (args: { user_id: string }) => {
        await this.handleSpeakingStop(args);
      });

      this.rpc.on('VOICE_CONNECTION_STATUS', async (args: DiscordData) => {
        await this.handleVoiceConnectionStatus(args);
      });

      this.rpc.on('NOTIFICATION_CREATE', async (args: any) => {
        this.DeskThingServer.sendLog(JSON.stringify(args));
      });

      this.rpc.on('error', (error: Error) => {
        this.DeskThingServer.sendError(`RPC Error: ${error.message}`);
      });

      this.rpc.on('disconnected', async (closeEvent: any) => {
        this.DeskThingServer.sendError(`Disconnected from Discord Error: ${closeEvent}`);
        this.DeskThingServer.sendError('RPC Disconnected! Attempting to reconnect...');
        await this.login();
      });

      this.DeskThingServer.sendLog('RPC events setup!');
    } catch (ex) {
      this.DeskThingServer.sendError(`RPC: Error initializing RPC: ${ex}`);
    }
  }

  async sendProfileData() {
    try {
      const user = this.rpc.user;
      if (user) {
        const profileData = {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          discriminator: user.discriminator,
          activities: [],
          custom_status: null,
        };

        this.DeskThingServer.sendDataToClient({
          app: 'discord',
          type: 'profile_data',
          payload: profileData,
        });
      }
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to send profile data: ${error}`);
    }
  }

  async mergeUserData(newUser: UserData) {
    let existingUserIndex = this.connectedUserList.findIndex((user) => user.id === newUser.id);

    if (existingUserIndex != -1) {
      this.connectedUserList[existingUserIndex] = {
        ...this.connectedUserList[existingUserIndex],
        ...newUser,
      };
    } else {
      existingUserIndex = this.connectedUserList.push(newUser) - 1;
    }

    this.connectedUserList[existingUserIndex].profile = await this.fetchUserProfilePicture(newUser);

    this.DeskThingServer.sendLog(
      `User ${this.connectedUserList[existingUserIndex].username} had data merged.`
    );

    return this.connectedUserList[existingUserIndex];
  }

  async fetchUserProfilePicture(user: UserData) {
    try {
      const pfp = await this.DeskThingServer.encodeImageFromUrl(
        `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      );
      return pfp;
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to fetch profile picture: ${error}`);
      return undefined;
    }
  }

  async handleVoiceStateCreate(args: DiscordData) {
    this.DeskThingServer.sendLog(`Handling Voice State Create: ${JSON.stringify(args)}`);
    const userData: UserData = {
      id: args.user.id,
      username: args.user.username,
      nick: args.nick,
      speaking: false,
      volume: args.volume || 100,
      mute: args.voice_state?.mute || args.voice_state?.self_mute || false,
      deaf: args.voice_state?.deaf || args.voice_state?.self_deaf || false,
      avatar: args.user.avatar,
      profile: undefined,
    };

    const mergedUser = await this.mergeUserData(userData);
    if (!mergedUser) {
      this.DeskThingServer.sendError('A user joined the channel and it caused an error');
      return;
    }

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'channel_member',
      request: 'connect',
      payload: mergedUser,
    });
  }

  async handleVoiceStateDelete(args: DiscordData) {
    this.DeskThingServer.sendLog(`Handling Voice State Delete: ${JSON.stringify(args)}`);

    this.connectedUserList = this.connectedUserList.filter((user) => user.id !== args.user.id);

    this.DeskThingServer.sendDataToClient({
      app: 'discord',
      type: 'channel_member',
      request: 'disconnect',
      payload: { id: args.user.id },
    });

    this.DeskThingServer.sendLog(`User ${args.user.username} has left the chat`);
  }

  async handleVoiceStateUpdate(args: DiscordData) {
    this.DeskThingServer.sendLog(`Handling Voice State Update: ${JSON.stringify(args)}`);

    const userData: UserData = {
      id: args.user.id,
      username: args.user.username,
      nick: args.nick,
      speaking: false,
      volume: args.volume || 100,
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
    this.DeskThingServer.sendLog(`Handling Speaking Start for user: ${args.user_id}`);
    const existingUser = this.connectedUserList.find((user) => user.id === args.user_id);
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
    this.DeskThingServer.sendLog(`Handling Speaking Stop for user: ${args.user_id}`);
    const existingUser = this.connectedUserList.find((user) => user.id === args.user_id);
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
    if (args.state === 'VOICE_CONNECTED' && this.selectedChannel == null) {
      await this.handleClientChannelSelect();
    }
    if (args.state === 'VOICE_CONNECTING') {
      const settings = await this.DeskThingServer.getData();
      if (settings?.settings?.auto_switch_view?.value) {
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
      this.DeskThingServer.sendLog('Connecting to a voice channel');
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
    this.DeskThingServer.sendLog('Setting activity...');
    try {
      if (!this.startTimestamp) {
        this.startTimestamp = new Date();
      }
      const uptimeMs = new Date().getTime() - this.startTimestamp.getTime();
      const msToTime = (duration: number) => {
        const seconds = String(Math.floor((duration / 1000) % 60)).padStart(2, '0');
        const minutes = String(Math.floor((duration / (1000 * 60)) % 60)).padStart(2, '0');
        const hours = String(Math.floor((duration / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        return hours !== '00' ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
      };

      await this.rpc
        .setActivity({
          details: 'Discord Profile Pal',
          state: `Active for ${msToTime(uptimeMs)}`,
          largeImageKey: 'discord_large',
          largeImageText: 'Discord Profile Pal',
          smallImageKey: 'discord_small',
          smallImageText: 'Active',
          instance: true,
        })
        .catch((error: Error) => {
          this.DeskThingServer.sendError(`Failed to set activity: ${error.message}`);
        });
      this.DeskThingServer.sendLog('Activity set successfully');
    } catch (ex) {
      this.DeskThingServer.sendError(`Error in setActivity: ${ex}`);
    }
  }

  async setSubscribe() {
    this.DeskThingServer.sendLog('Subscribing to voice channels and connection status');
    await this.rpc.subscribe('VOICE_CHANNEL_SELECT', {});
    await this.rpc.subscribe('VOICE_CONNECTION_STATUS', {});
    await this.rpc.subscribe('NOTIFICATION_CREATE', {});
  }

  async refreshCallData() {
    try {
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
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to refresh call data: ${error}`);
    }
  }

  async setClientVoiceSetting(data: any) {
    this.DeskThingServer.sendLog(`Attempting to change voice setting to: ${JSON.stringify(data)}`);
    try {
      await this.rpc.setVoiceSettings(data);
      if (this.rpc.user) {
        await this.mergeUserData({
          id: this.rpc.user.id,
          username: this.rpc.user.username,
          speaking: false,
          mute: data.mute || false,
          deaf: data.deaf || false,
          avatar: this.rpc.user.avatar,
        });
        this.DeskThingServer.sendDataToClient({
          app: 'discord',
          type: 'voice_data',
          payload: {
            id: this.rpc.user.id,
            ...data,
          },
        });
      }
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to set voice settings: ${error}`);
    }
  }

  async handleClientChannelSelect() {
    this.DeskThingServer.sendLog('[Server] Fetching Discord channel info');
    try {
      const channel = await this.rpc.getSelectedChannel();
      if (!channel) {
        this.DeskThingServer.sendError('[Server] Channel could not be fetched');
        return;
      }

      this.selectedChannel = channel;
      this.DeskThingServer.sendLog(`Set the selected channel to ${this.selectedChannel?.id}`);

      await this.hydrateUsers();

      this.subscriptions.voice[this.selectedChannel.id] = [
        await this.rpc.subscribe('VOICE_STATE_UPDATE', { channel_id: this.selectedChannel.id }),
        await this.rpc.subscribe('VOICE_STATE_CREATE', { channel_id: this.selectedChannel.id }),
        await this.rpc.subscribe('VOICE_STATE_DELETE', { channel_id: this.selectedChannel.id }),
        await this.rpc.subscribe('SPEAKING_START', { channel_id: this.selectedChannel.id }),
        await this.rpc.subscribe('SPEAKING_STOP', { channel_id: this.selectedChannel.id }),
      ];

      this.DeskThingServer.sendLog(`Subscribed to voice events for channel ${this.selectedChannel.id}`);

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
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to handle channel select: ${error}`);
    }
  }

  async hydrateUsers() {
    this.DeskThingServer.sendLog('[Server] Attempting to hydrate users');
    if (this.selectedChannel?.voice_states) {
      for (const voiceState of this.selectedChannel.voice_states) {
        if (voiceState.user) await this.mergeUserData(voiceState.user);
      }
      return;
    }
    this.DeskThingServer.sendError('[Server] Failed to hydrate users');
  }

  async clearSelectedChannel() {
    if (this.selectedChannel == null) return;
    if (this.subscriptions.voice[this.selectedChannel.id]) {
      this.DeskThingServer.sendLog(`Found stale channel ${this.selectedChannel.id}, cleaning up...`);
      this.subscriptions.voice[this.selectedChannel.id].forEach((sub: any) => sub.unsubscribe());
    }

    this.recentChannels.push(this.selectedChannel);
    this.selectedChannel = null;
    this.connectedUserList = [];
  }

  async setUserVoiceState(voice_state: UserVoiceState) {
    this.DeskThingServer.sendLog(`[Server] Attempting to change voice state ${JSON.stringify(voice_state)}`);
    try {
      await this.rpc.setUserVoiceSettings(voice_state.id, voice_state);
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to set user voice state: ${error}`);
    }
  }

  async leaveCall() {
    this.DeskThingServer.sendLog('Attempting to leave call...');
    try {
      await this.rpc.selectVoiceChannel(null);
    } catch (error) {
      this.DeskThingServer.sendError(`Failed to leave call: ${error}`);
    }
  }

  getSelectedChannelUsers() {
    if (this.selectedChannel == null) {
      this.DeskThingServer.sendError('[Server] Can not get connected users because the client is not in a voice channel');
      return [];
    }

    if (this.connectedUserList.length <= 0) {
      this.DeskThingServer.sendError('[Server] The user cache is empty, there are no users to return');
      return [];
    }

    this.DeskThingServer.sendLog('[Server] Attempting to get cached users in the current call');
    return this.connectedUserList;
  }

  getCachedUser(id: string) {
    this.DeskThingServer.sendLog(`Attempting to fetch user with id ${id}`);
    const user = this.connectedUserList.find((u) => u.id == id);
    if (!user) {
      this.DeskThingServer.sendError(`User ${id} does not exist in the connected user cache`);
      return null;
    }
    return user;
  }
}

export default DiscordHandler;
