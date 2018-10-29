#import "fwd.h"
#import <Foundation/Foundation.h>
@import Tanker;

NS_ASSUME_NONNULL_BEGIN

@interface Globals : NSObject

+ (Globals *)sharedInstance;

- (PMKPromise *)buildTanker;

- (PMKPromise<NSString *> *)signUpWithEmail:(NSString *)email
                                   password:(NSString *)password;
- (PMKPromise<NSString *> *)logInWithEmail:(NSString *)email
                                  password:(NSString *)password;
- (PMKPromise *)changeEmail:(NSString *)newEmail;
- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword;
- (PMKPromise *)logout;

- (PMKPromise<NSDictionary *> *)getMe;
- (PMKPromise<NSArray*> *)getUsers;
- (PMKPromise<NSString *> *)getData;
- (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userIdFrom;
- (PMKPromise *)putData:(NSString *)data;
- (PMKPromise *)shareTo:(NSArray<NSString *> *)recipients;

@property TKRTanker *tanker;
@property NSString *email;
@property NSString *userId;

@end

NS_ASSUME_NONNULL_END
