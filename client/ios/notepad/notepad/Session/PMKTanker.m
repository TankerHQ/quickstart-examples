#import "PMKTanker.h"
@import Tanker;

@implementation PMKTanker

+ tankerWithOptions:(TKRTankerOptions*) options {
  PMKTanker* res = [[PMKTanker alloc] initWithOptions:options];
  return res;
}

- (instancetype)initWithOptions:(TKRTankerOptions *)options {
  self = [super init];
  self.tanker = [TKRTanker tankerWithOptions:options];
  return self;
}

+(NSString*) versionString {
  return [TKRTanker versionString];
}
- (PMKPromise*)registerUnlockWithOptions:(nonnull TKRUnlockOptions*)options {
  return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
    [self.tanker registerUnlockWithOptions:options completionHandler:resolver];
  }];
}

- (PMKPromise<NSNumber*>*)signUpWithIdentity:(nonnull NSString*)identity authenticationMethods:(nonnull TKRAuthenticationMethods*)methods {
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker signUpWithIdentity:identity
               authenticationMethods: methods
                  completionHandler:adapter];
  }];
}

- (PMKPromise<NSNumber*>*)signInWithIdentity:(nonnull NSString*)identity
                                     options:(nonnull TKRSignInOptions*)options {
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker signInWithIdentity:identity
                            options:options
                  completionHandler:adapter];
  }];
}

- (BOOL)isOpen {
  return [self.tanker isOpen];
}

- (PMKPromise*) signOut {
  return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
    [self.tanker signOutWithCompletionHandler:resolver];
  }];
}

- (PMKPromise<NSData*> *)encryptDataFromString:(NSString*)clearText
                                       options:(TKREncryptionOptions*)options{
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker encryptDataFromString:clearText options:options completionHandler:adapter];
  }];
}

- (PMKPromise<NSString*> *)decryptStringFromData:(nonnull NSData*)encryptedData {
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker decryptStringFromData:encryptedData completionHandler:adapter];
  }];
}

@end
