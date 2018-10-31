#import "fwd.h"
#import <Foundation/Foundation.h>
@import Tanker;

NS_ASSUME_NONNULL_BEGIN

@interface Globals : NSObject

+ (Globals *)sharedInstance;

- (PMKPromise *)buildTanker;
+ (PMKPromise<NSString *> *)signupWithEmail:(NSString *)email
                                   password:(NSString *)password;
+ (PMKPromise<NSString *> *)loginWithEmail:(NSString *)email
                                  password:(NSString *)password;
+ (PMKPromise *)logout;
+ (PMKPromise *)uploadToServer:(NSString *)data;
+ (PMKPromise<NSString *> *)dataFromServer;
+ (PMKPromise *)changeEmail:(NSString *)newEmail;
+ (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword;
+ (PMKPromise *)shareNoteFrom:(NSString *)userId
                           to:(NSArray<NSString *> *)recipients;
+ (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userIdFrom;
+ (PMKPromise<NSArray<id> *> *)getUsers;
+ (PMKPromise<NSDictionary *> *)getMe;


@property NSString *serverAddress;
@property TKRTanker *tanker;
@property NSString *email;
@property NSString *trustchainId;
@property NSString *userId;

@end

NS_ASSUME_NONNULL_END
