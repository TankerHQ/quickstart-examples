
#import "fwd.h"
#import <Foundation/Foundation.h>
@import Tanker;

@interface Globals : NSObject

+ (Globals*)sharedInstance;

+ (PMKPromise<NSString*>*)signupWithEmail:(NSString*)email password:(NSString*)password;
+ (PMKPromise<NSString*>*)loginWithEmail:(NSString*)email password:(NSString*)password;
+ (PMKPromise*)uploadToServer:(NSString*)data;
+ (PMKPromise<NSString*>*)dataFromServer;
+ (PMKPromise*)changePasswordFrom:(NSString*)oldPassword to:(NSString*)newPassword;
+ (PMKPromise*)shareNoteFrom:(NSString*)userId to:(NSArray<NSString*>*)recipients;
+ (PMKPromise<NSString*>*)getDataFromUser:(NSString*)userIdFrom;
+ (PMKPromise<NSArray<id>*>*)getUsers;

@property NSString* serverAddress;
@property TKRTanker* tanker;
@property NSString* email;
@property NSString* password;
@property NSString* trustchainId;
@property NSString* userId;

@end
