#import "PMKTanker.h"
@import Tanker;

@interface PMKTanker ()

@property TKRTanker* tanker;

@end

@implementation PMKTanker

+ (instancetype)tankerWithOptions:(nonnull TKRTankerOptions*)options
{
  return [[PMKTanker alloc] initWithOptions:options];
}

- (instancetype)initWithOptions:(nonnull TKRTankerOptions*)options
{
  self = [super init];
  self.tanker = [TKRTanker tankerWithOptions:options];
  return self;
}

+ (nonnull NSString*)versionString
{
  return [TKRTanker versionString];
}

- (nonnull PMKPromise<NSNumber*>*)startWithIdentity:(nonnull NSString*)identity
{
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker startWithIdentity:identity completionHandler:^(TKRStatus status, NSError* err) {
      adapter([NSNumber numberWithUnsignedInteger:status], err);
    }];
  }];
}

- (nonnull PMKPromise*)stop
{
  return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
    [self.tanker stopWithCompletionHandler:resolver];
  }];
}

- (nonnull PMKPromise*)verifyIdentityWithVerification:(nonnull TKRVerification*)verification
{
  return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
    [self.tanker verifyIdentityWithVerification:verification completionHandler:resolver];
  }];
}

- (nonnull PMKPromise*)registerIdentityWithVerification:(nonnull TKRVerification*)verification
{
  return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
    [self.tanker registerIdentityWithVerification:verification completionHandler:resolver];
  }];
}

- (nonnull PMKPromise*)setVerificationMethod:(nonnull TKRVerification*)verification
{
  return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
    [self.tanker setVerificationMethod:verification completionHandler:resolver];
  }];
}

- (nonnull PMKPromise<NSData*>*)encryptDataFromString:(nonnull NSString*)clearText
                                              options:(nonnull TKREncryptionOptions*)options
{
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker encryptDataFromString:clearText options:options completionHandler:adapter];
  }];
}

- (nonnull PMKPromise<NSString*>*)decryptStringFromData:(nonnull NSData*)encryptedData
{
  return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
    [self.tanker decryptStringFromData:encryptedData completionHandler:adapter];
  }];
}

@end
