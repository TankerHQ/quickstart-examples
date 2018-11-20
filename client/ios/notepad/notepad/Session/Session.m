#import "Session.h"

NSString *getWritablePath() {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory,
                                                       NSUserDomainMask, YES);
  NSString *libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
}

@interface Session ()

@property (readwrite) TKRTanker *tanker;
@property (readonly) PMKPromise<TKRTanker *> *tankerReadyPromise;
@property (nullable) NSString *tempUnlockPassword;
@property (nullable) NSString *tempUnlockVerificationCode;

@end

@implementation Session

- (instancetype)init {
  self = [super init];

  if (self) {
    _apiClient = [ApiClient new];

    // Start now and let run in background
    _tankerReadyPromise = [_apiClient getConfig].then(^(NSDictionary *config) {
      NSString *trustchainId = config[@"trustchainId"];
      NSLog(@"Using trustchain ID: %@", trustchainId);

      TKRTankerOptions *opts = [TKRTankerOptions options];
      opts.trustchainID = trustchainId;
      opts.writablePath = getWritablePath();

      NSString *url = config[@"url"];
      if (url && url.length > 0) {
        opts.trustchainURL = url;
      }

      TKRTanker *tanker = [TKRTanker tankerWithOptions:opts];

      [tanker connectUnlockRequiredHandler:^{
        NSLog(@"Tanker device unlock required");
        if (self.tempUnlockVerificationCode) {
          NSLog(@"Tanker device unlock with verification code");
          // TODO: unlock with verification code
           [self.tanker unlockCurrentDeviceWithVerificationCode:self.tempUnlockVerificationCode].then(^{
             NSLog(@"Tanker device unlock with verification code success");
             self.tempUnlockVerificationCode = nil;
           });
        } else if (self.tempUnlockPassword) {
          NSLog(@"Tanker device unlock with password");
          [tanker unlockCurrentDeviceWithPassword:self.tempUnlockPassword].then(^{
            NSLog(@"Tanker device unlock with password success");
            self.tempUnlockPassword = nil;
          });
        }
      }];

      NSLog(@"Tanker initialized");
      self.tanker = tanker;
      return tanker;
    });
  }

  return self;
}

+ (Session *)sharedSession {
  static Session *sharedSession = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedSession = [Session new];
  });
  return sharedSession;
}

- (PMKPromise<TKRTanker *> *)tankerReady {
  return self.tankerReadyPromise;
}

- (PMKPromise *)signUpWithEmail:(NSString *)email
                      password:(NSString *)password {
  self.tempUnlockPassword = password;

  return [self tankerReady].then(^() {
    return [self.apiClient signUpWithEmail:email password:password];
  }).then(^(NSDictionary *user) {
    return [self.tanker openWithUserID:user[@"id"] userToken:user[@"token"]];
  }).then(^{
    TKRUnlockOptions *unlockOpts = [TKRUnlockOptions defaultOptions];
    unlockOpts.password = password;
    unlockOpts.email = email;
    return [self.tanker registerUnlock:unlockOpts];
  }).then(^{
    self.tempUnlockPassword = nil;
    NSLog(@"Tanker is open");
  });
}

- (PMKPromise *)logInWithEmail:(NSString *)email
                     password:(NSString *)password {
  self.tempUnlockPassword = password;

  return [self tankerReady].then(^() {
    return [self.apiClient logInWithEmail:email password:password];
  }).then(^(NSDictionary *user) {
    return [self.tanker openWithUserID:user[@"id"] userToken:user[@"token"]];
  }).then(^{
    return [self.tanker isUnlockAlreadySetUp];
  }).then(^(NSNumber *setUp) {
    if ([setUp isEqualToNumber:@NO]) {
      TKRUnlockOptions *unlockOpts = [TKRUnlockOptions defaultOptions];
      unlockOpts.password = password;
      unlockOpts.email = email;
      return [self.tanker registerUnlock:unlockOpts];
    }
    return [PMKPromise promiseWithValue:nil];;
  }).then(^{
    self.tempUnlockPassword = nil;
    NSLog(@"Tanker is open");
  });
}

- (PMKPromise *)changeEmail:(NSString *)newEmail {
  return [self.apiClient changeEmail:newEmail].then(^{
    TKRUnlockOptions *unlockOpts = [TKRUnlockOptions defaultOptions];
    unlockOpts.email = newEmail;
    return [self.tanker registerUnlock:unlockOpts];
  });
}

- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword {
  return [self.apiClient changePasswordFrom:oldPassword to:newPassword].then(^{
    return [self tankerReady];
  }).then(^() {
    TKRUnlockOptions *unlockOpts = [TKRUnlockOptions defaultOptions];
    unlockOpts.password = newPassword;
    return [self.tanker registerUnlock:unlockOpts];
  });
}

- (PMKPromise *)resetPasswordTo:(NSString *)newPassword
                      withToken:(NSString *)resetToken
               verificationCode:(NSString *)verificationCode {
  self.tempUnlockVerificationCode = verificationCode;

  return [self.apiClient resetPasswordTo:newPassword withToken:resetToken].then(^(NSString *email) {
    return [self logInWithEmail:email password:newPassword];
  }).then(^{
    self.tempUnlockVerificationCode = nil;
    return [self tankerReady];
  }).then(^() {
    TKRUnlockOptions *unlockOpts = [TKRUnlockOptions defaultOptions];
    unlockOpts.password = newPassword;
    return [self.tanker registerUnlock:unlockOpts];
  });
}

- (PMKPromise *)logout {
  return [self.apiClient logout].then(^{
    return [self tankerReady];
  }).then(^() {
    return [self.tanker close];
  });
}

- (PMKPromise<NSDictionary *> *)getMe {
  return [self.apiClient getMe];
}

- (PMKPromise<NSArray *> *)getUsers {
  return [self.apiClient getUsers];
}

- (PMKPromise<NSString *> *)getData {
  return [self getDataFromUser:self.apiClient.currentUserId];
}

- (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userId {
  return [self tankerReady].then(^() {
    return [self.apiClient getDataFromUser:userId];
  }).then(^(NSString *b64EncryptedData) {
    NSData *encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
    return [self.tanker decryptStringFromData:encryptedData];
  });
}

- (PMKPromise<NSString *> *)emailsToUserIds:(NSArray<NSString *> *)emails
{
  if (!emails || emails.count == 0) {
    return [PMKPromise promiseWithValue:@[]];
  }

  return [self getUsers].then(^(NSArray *users) {
    NSMutableArray<NSString*> *userIds = [NSMutableArray new];

    for (NSString *email in emails) {
      NSPredicate *predicate = [NSPredicate predicateWithFormat:@"email==%@", email];
      NSArray *results = [users filteredArrayUsingPredicate:predicate];

      if ([results count] == 1) {
        NSString* userId = results[0][@"id"];
        [userIds addObject:userId];
      } else {
        NSString *errDesc = [@"User id not found for email: " stringByAppendingString:email];
        NSString *domain = @"io.tanker.notepad";
        NSDictionary *userInfo = @{NSLocalizedDescriptionKey: errDesc};
        NSError *err = [[NSError alloc] initWithDomain:domain code:1 userInfo:userInfo];
        return [PMKPromise promiseWithValue:err];
      }
    }

    return [PMKPromise promiseWithValue:userIds];
  });
}

- (TKREncryptionOptions*)buildEncryptOptions:(NSArray<NSString *> *)recipientIds
{
  TKREncryptionOptions *opts = [TKREncryptionOptions defaultOptions];
  opts.shareWithUsers = recipientIds;
  return opts;
}

- (PMKPromise *)putData:(NSString *)data {
  return [self putData:data shareWith:@[]];
}

- (PMKPromise *)putData:(NSString *)data shareWith:(NSArray<NSString *> *)recipientEmails {
  return [self tankerReady].then(^() {
    return [self emailsToUserIds:recipientEmails];

  }).then(^(NSArray<NSString *> *recipientIds) {
    TKREncryptionOptions *opts = [self buildEncryptOptions:recipientIds];

    return [self.tanker encryptDataFromString:data options:opts].then(^(NSData *encryptedData) {
      NSString* b64EncryptedData = [encryptedData base64EncodedStringWithOptions:0];
      return [self.apiClient putData:b64EncryptedData];

    }).then(^{
      NSLog(@"Data sent to server");
      NSLog(@"Sharing data with %@", recipientIds); // if empty, will "unshare"
      return [self.apiClient shareWith:recipientIds];
    });
  });
}

@end
