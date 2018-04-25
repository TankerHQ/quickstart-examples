//
//  Globals.h
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#ifndef Globals_h
#define Globals_h

@import Tanker;

@interface Globals : NSObject

+ (Globals *)sharedInstance;

+ (PMKPromise*)fetchUserToken:(NSString*)method userId:(NSString*)userId password:(NSString*)password;
+ (PMKPromise*) uploadToServer:(NSData*)encryptedData;
+ (PMKPromise*) dataFromServer;

@property TKRTanker* tanker;
@property NSString* serverAddress;

@end

#endif /* Globals_h */
