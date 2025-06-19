
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
    
    const deskThing = deskThingCore.getDeskThingInstance();
    deskThing.triggerAction({ 
      id: 'log', 
      source: 'client',
      payload: { level, message, data } 
    });
  }

  public sendError(error: Error, context?: string) {
    console.error('DeskThing Error:', error, context);
    
    const deskThing = deskThingCore.getDeskThingInstance();
    deskThing.triggerAction({ 
      id: 'error', 
      source: 'client',
      payload: { error: error.message, context } 
    });
  }
}

export const deskThingLogger = DeskThingLogger.getInstance();
