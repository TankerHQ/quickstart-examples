#import <Foundation/Foundation.h>

#import <TKRTanker.h>
#import <TKRSignInResult.h>
#import <TKRTankerOptions.h>
#import <TKREncryptionOptions.h>

@import PromiseKit;

NS_ASSUME_NONNULL_BEGIN

@interface PMKTanker : NSObject

/**
 * Wraps TKRTanker with PromiseKit
 * This means you can use code like this:
 *
 *    [self.tanker signInWithOptions: options]
 *    .then(^(NSNumber*) {
 *        // ...
 *    }).
 *    catch(NSError*) {
 *        // ...
 *    });
 *
 * instead of the awkward:
 *
 *   [self.tanker signInWithOptions: options
 *       completionHandler:(^(NSNumber*, NSError*) {
 *         if (error != nil) {
 *           // ...
 *         }
 *         // ...
 *       })
 *   ];
 */

@property TKRTanker *tanker;

// Note: some methods from TKRTanker are not wrapped. For instance, the
// notepad always assume that the unlock methods by password and emails are set, and
// so we only wrap the signUpWithIdentity overload that takes a TRKUnlockOptions
//
// In the same vein, since Notepad only deals with text, we only wrap
// encryptDataFromString and not encryptDataFromData

+ tankerWithOptions:(TKRTankerOptions*) options;
-(instancetype) initWithOptions:(TKRTankerOptions*)options;
+(NSString*) versionString;
- (PMKPromise*) registerUnlockWithOptions:(nonnull TKRUnlockOptions*)options;

- (PMKPromise<NSNumber*>*) signUpWithIdentity:(nonnull NSString*)identity
            authenticationMethods:(nonnull TKRAuthenticationMethods*)methods;

- (PMKPromise<NSNumber*>*) signInWithIdentity:(nonnull NSString*)identity
                                     options:(nonnull TKRSignInOptions*)options;

- (BOOL) isOpen;

- (PMKPromise*) signOut;

- (PMKPromise<NSData*> *)encryptDataFromString:(NSString*)clearText
                                       options:(TKREncryptionOptions*)options;

- (PMKPromise<NSString*> *)decryptStringFromData:(nonnull NSData*)encryptedData;


@end

NS_ASSUME_NONNULL_END
