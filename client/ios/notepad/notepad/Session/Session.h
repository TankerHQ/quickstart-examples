#import <Foundation/Foundation.h>
#import "ApiClient.h"
#import "PMKTanker.h"

@import PromiseKit;
@import Tanker;

NS_ASSUME_NONNULL_BEGIN

@interface Session : NSObject

@property (readonly) ApiClient *apiClient;

+ (Session *)sharedSession;

- (PMKPromise<PMKTanker *> *)tankerReady;

- (PMKPromise *)signUpWithEmail:(NSString *)email
                      password:(NSString *)password;
- (PMKPromise *)logInWithEmail:(NSString *)email
                     password:(NSString *)password;
- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword;
- (PMKPromise *)logout;

- (PMKPromise<NSDictionary *> *)getMe;
- (PMKPromise<NSArray *> *)getUsers;
- (PMKPromise<NSString *> *)getData;
- (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userId;
- (PMKPromise *)putData:(NSString *)data;
- (PMKPromise *)putData:(NSString *)data shareWith:(NSArray<NSString *> *)recipientEmails;

@end

NS_ASSUME_NONNULL_END
