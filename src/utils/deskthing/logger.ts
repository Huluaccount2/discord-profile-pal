
import { deskThingCore } from './core';

export class DeskThingLogger {
  private static instance: DeskThingLogger;

  private constructor() {}

  public static getInstance(): DeskThingLogger {
    if (!DeskThingLogger.instance) {
      DeskThingLogger.instance = new DeskThingLogger();
    }
    return DeskThingLogger.instance;
  }

  public sendLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    console.log(`DeskThing Log [${level}]: ${message}`, data);
    
    try {
      const deskThing = deskThingCore.getDeskThingInstance();
      if (deskThing && typeof deskThing.triggerAction === 'function') {
        deskThing.triggerAction({ 
          id: 'log', 
          source: 'client',
          payload: { level, message, data } 
        });
      }
    } catch (error) {
      console.warn('DeskThing: Could not send log to server:', error);
    }
  }

  public sendError(error: Error, context?: string) {
    console.error('DeskThing Error:', error, context);
    
    try {
      const deskThing = deskThingCore.getDeskThingInstance();
      if (deskThing && typeof deskThing.triggerAction === 'function') {
        deskThing.triggerAction({ 
          id: 'error', 
          source: 'client',
          payload: { error: error.message, context } 
        });
      }
    } catch (logError) {
      console.warn('DeskThing: Could not send error to server:', logError);
    }
  }
}

export const deskThingLogger = DeskThingLogger.getInstance();
