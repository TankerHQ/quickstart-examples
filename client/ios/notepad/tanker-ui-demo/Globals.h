
#import "fwd.h"
#import <Foundation/Foundation.h>
@import Tanker;

@interface Globals : NSObject

+ (Globals*)sharedInstance;

+ (PMKPromise<NSString*>*)signupWithUserId:(NSString*)userId password:(NSString*)password;
+ (PMKPromise<NSString*>*)loginWithUserId:(NSString*)userId password:(NSString*)password;
+ (PMKPromise*)uploadToServer:(NSString*)data;
+ (PMKPromise<NSString*>*)dataFromServer;
+ (PMKPromise*)changePassword:(NSString*)newPassword;
+ (PMKPromise*)shareNoteWith:(NSArray<NSString*>*)recipients;
+ (PMKPromise<NSString*>*)getDataFromUser:(NSString*)userIdFrom;

@property NSString* serverAddress;
@property TKRTanker* tanker;
@property NSString* userId;
@property NSString* password;
@property NSString* trustchainId;

@end
