#import <Foundation/Foundation.h>

@import Tanker;
@import PromiseKit;

NS_ASSUME_NONNULL_BEGIN

@interface PMKTanker : NSObject

/**
 * Wraps TKRTanker with PromiseKit
 * This means you can use code like this:
 *
 *    [self.tanker startWithIdentity:identity]
 *    .then(^(NSNumber* status) {
 *        // ...
 *    }).
 *    catch(NSError* err) {
 *        // ...
 *    });
 *
 * instead of the more-verbose:
 *
 *   [self.tanker startWithIdentity:identity
 *       completionHandler:(^(NSNumber* status, NSError* err) {
 *         if (err != nil) {
 *           // ...
 *         }
 *         // ...
 *       })
 *   ];
 */

// Note: some methods from TKRTanker are not wrapped. For instance,
// Notepad only deals with text, so we only wrap
// encryptDataFromString and not encryptDataFromData

+ (nonnull NSString*)versionString;
+ (instancetype)tankerWithOptions:(nonnull TKRTankerOptions*)options;
- (instancetype)initWithOptions:(nonnull TKRTankerOptions*)options;

- (nonnull PMKPromise<NSNumber*>*)startWithIdentity:(nonnull NSString*)identity;
- (nonnull PMKPromise*)stop;

- (nonnull PMKPromise*)registerIdentityWithVerification:(nonnull TKRVerification*)verification;
- (nonnull PMKPromise*)verifyIdentityWithVerification:(nonnull TKRVerification*)verification;
- (nonnull PMKPromise*)setVerificationMethod:(nonnull TKRVerification*)verification;

- (nonnull PMKPromise<NSData*>*)encryptDataFromString:(nonnull NSString*)clearText
                                              options:(nonnull TKREncryptionOptions*)options;
- (nonnull PMKPromise<NSString*>*)decryptStringFromData:(nonnull NSData*)encryptedData;

@end

NS_ASSUME_NONNULL_END
