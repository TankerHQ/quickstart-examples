#import "Session.h"

NSString *getWritablePath() {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory,
                                                       NSUserDomainMask, YES);
  NSString *libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
}

// Wrapper for data returned by the Notepad server when sharing with other users
// we need the publicIdentity for Tanker' s encrypt options, and the userId
// for the registering the sharing operation on the Notepad server
@interface Recipient : NSObject

@property NSString* publicIdentity;
@property NSString* userId;

-(instancetype) initWithDictionary:(NSDictionary*)dict;
+(instancetype) recipientWithDictionary:(NSDictionary*)dict;

@end

@implementation Recipient

-(instancetype) initWithDictionary:(NSDictionary*)dict {
  self = [super init];
  self.publicIdentity = dict[@"publicIdentity"];
  self.userId = dict[@"id"];
  return self;
}

+(instancetype) recipientWithDictionary:(NSDictionary *)dict {
  return [[Recipient alloc] initWithDictionary:dict];
}

@end

@interface Session ()

@property (readwrite) TKRTanker *tanker;
@property (readonly) PMKPromise<TKRTanker *> *tankerReadyPromise;

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
  return [self tankerReady].then(^() {
    return [self.apiClient signUpWithEmail:email password:password];
  }).then(^(NSDictionary *user) {
    return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
      [self.tanker signUpWithIdentity:user[@"identity"] completionHandler:adapter];
    }].then(^(NSNumber* result) {
      NSLog(@"Signup result %i", [result intValue]);
    }).catch(^(NSError* error) {
      NSLog(@"Could not sign up: %@", [error localizedDescription]);
    });
  });
}

- (PMKPromise *)logInWithEmail:(NSString *)email
                     password:(NSString *)password {
  return [self tankerReady].then(^() {
    return [self.apiClient logInWithEmail:email password:password];
  }).then(^(NSDictionary *user) {
    return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
      TKRSignInOptions* signInOptions = [TKRSignInOptions options];
      signInOptions.password = password;
      NSString* identity = user[@"identity"];
      [self.tanker signInWithIdentity:identity options:signInOptions completionHandler:adapter];
    }].then(^(NSNumber* result) {
      NSLog(@"Signin result: %i", [result intValue]);
      if (result.integerValue == TKRSignInResultOk) {
        return [PMKPromise promiseWithValue:nil];
      } else {
        NSString *errDesc = [NSString stringWithFormat:@"Got unexpected signin result: %i", result.intValue];
        NSString *domain = @"io.tanker.notepad";
        NSDictionary *userInfo = @{NSLocalizedDescriptionKey: errDesc};
        NSError *err = [[NSError alloc] initWithDomain:domain code:1 userInfo:userInfo];
        return [PMKPromise promiseWithValue:err];
      }
    }).catch(^(NSError* error) {
      NSLog(@"Could not sign in: %@", [error localizedDescription]);
    });
  });
}

- (PMKPromise *)changeEmail:(NSString *)newEmail {
  return [self.apiClient changeEmail:newEmail].then(^{
    return [self tankerReady];
  }).then(^() {
    return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
      TKRUnlockOptions* unlockOptions = [TKRUnlockOptions options];
      unlockOptions.email = newEmail;
      [self.tanker registerUnlockWithOptions:unlockOptions
                           completionHandler:resolver];

    }];
  });
}

- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword {
  return [self.apiClient changePasswordFrom:oldPassword to:newPassword].then(^{
    return [self tankerReady];
  }).then(^() {
    return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
      TKRUnlockOptions* unlockOptions = [TKRUnlockOptions options];
      unlockOptions.password = newPassword;
      [self.tanker registerUnlockWithOptions:unlockOptions
                           completionHandler:resolver];

    }];
  });
}

// This works in the following steps:
// 1/ Ask the server a password reset using the reset Token -
//    the server some JSON answer containing a Tanker identity
// 2/ Use the Tanker identity and the verification code to
//    sign in Tanker
// 3/ Update the unlock password
- (PMKPromise *)resetPasswordTo:(NSString *)newPassword
                      withToken:(NSString *)resetToken
                verificationCode:(NSString *)verificationCode {
  return [self.apiClient resetPasswordTo:newPassword withToken:resetToken].then(^(NSDictionary *resetResult) {
    NSString* identity = resetResult[@"indentity"];
    TKRSignInOptions* signinOptions = [TKRSignInOptions options];
    signinOptions.verificationCode = verificationCode;
    return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
        return [self.tanker signInWithIdentity:identity options:signinOptions completionHandler:adapter];
    }].then(^(){
      TKRUnlockOptions* unlockOptions = [TKRUnlockOptions options];
      unlockOptions.password = newPassword;
      return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
        [self.tanker registerUnlockWithOptions:unlockOptions
                             completionHandler:resolver];
      }];
    });
  });
}

- (PMKPromise *)logout {
  return [self.apiClient logout].then(^{
    return [self tankerReady];
  }).then(^() {
    return [PMKPromise promiseWithResolver:^(PMKResolver resolver) {
      [self.tanker signOutWithCompletionHandler:resolver];
    }];
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
    return [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
      [self.tanker decryptStringFromData:encryptedData completionHandler:adapter];
    }];
  });
}

- (PMKPromise<NSArray *> *)emailsToRecipients:(NSArray<NSString *> *)emails
{
  if (!emails || emails.count == 0) {
    return [PMKPromise promiseWithValue:@[]];
  }

  return [self getUsers].then(^(NSArray *users) {
    NSMutableArray<Recipient*> *res = [NSMutableArray new];

    for (NSString *email in emails) {
      NSPredicate *predicate = [NSPredicate predicateWithFormat:@"email==%@", email];
      NSArray *results = [users filteredArrayUsingPredicate:predicate];

      if ([results count] == 1) {
        Recipient* recipient = [Recipient recipientWithDictionary: results[0]];
        [res addObject:recipient];
      } else {
        NSString *errDesc = [@"User id not found for email: " stringByAppendingString:email];
        NSString *domain = @"io.tanker.notepad";
        NSDictionary *userInfo = @{NSLocalizedDescriptionKey: errDesc};
        NSError *err = [[NSError alloc] initWithDomain:domain code:1 userInfo:userInfo];
        return [PMKPromise promiseWithValue:err];
      }
    }

    return [PMKPromise promiseWithValue:res];
  });
}

- (PMKPromise *)putData:(NSString *)data {
  return [self putData:data shareWith:@[]];
}

- (PMKPromise *)putData:(NSString *)data shareWith:(NSArray<NSString *> *)recipientEmails {
  return [self tankerReady].then(^() {
    return [self emailsToRecipients:recipientEmails];

  }).then(^(NSArray<Recipient *> *recipients) {
    TKREncryptionOptions *encryptOptions = [TKREncryptionOptions options];
    __block NSMutableArray<NSString*>* recipientsIdentities = [[NSMutableArray alloc] init];
    [recipients enumerateObjectsUsingBlock:^(Recipient * _Nonnull recipient, NSUInteger idx, BOOL * _Nonnull stop) {
      NSString* identity = recipient.publicIdentity;
      [recipientsIdentities addObject:identity];
    }];
    encryptOptions.shareWithUsers = recipientsIdentities;
    [PMKPromise promiseWithAdapter:^(PMKAdapter adapter) {
      [self.tanker encryptDataFromString:data
                                 options: encryptOptions
                       completionHandler:adapter];
    }].then(^(NSData* encryptedData) {
      NSString* b64EncryptedData = [encryptedData base64EncodedStringWithOptions:0];
      return [self.apiClient putData:b64EncryptedData];
    }).then(^{
      NSLog(@"Data encrypted and sent to server");
      NSMutableArray* recipientIds = [[NSMutableArray alloc] init];
      [recipients enumerateObjectsUsingBlock:^(Recipient * _Nonnull recipient, NSUInteger idx, BOOL * _Nonnull stop) {
        NSString* recipientId = recipient.userId;
        [recipientIds addObject: recipientId];
      }];
      NSLog(@"Sharing data with %@", recipientIds); // if empty, will "unshare"
      return [self.apiClient shareWith:recipientIds];
    }).catch(^(NSError* error) {
      NSLog(@"Could not encrypt: %@", [error localizedDescription]);
    });
  });
}

@end
