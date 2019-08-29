#import "Session.h"

NSString* getWritablePath()
{
  NSFileManager* fileManager = [NSFileManager defaultManager];
  NSArray* urls = [fileManager URLsForDirectory:NSLibraryDirectory inDomains:NSUserDomainMask];
  NSURL* url = [urls objectAtIndex:0];
  return [url path];
}

// Wrapper for data returned by the Notepad server when sharing with other users
// we need the publicIdentity for Tanker' s encrypt options, and the userId
// for the registering the sharing operation on the Notepad server
@interface Recipient : NSObject

@property NSString* publicIdentity;
@property NSString* userId;

- (instancetype)initWithDictionary:(NSDictionary*)dict;
+ (instancetype)recipientWithDictionary:(NSDictionary*)dict;

@end

@implementation Recipient

- (instancetype)initWithDictionary:(NSDictionary*)dict
{
  self = [super init];
  self.publicIdentity = dict[@"publicIdentity"];
  self.userId = dict[@"id"];
  return self;
}

+ (instancetype)recipientWithDictionary:(NSDictionary*)dict
{
  return [[Recipient alloc] initWithDictionary:dict];
}

@end

@interface Session ()

@property(readwrite) PMKTanker* tanker;
@property(readonly) PMKPromise<PMKTanker*>* tankerReadyPromise;

@end

@implementation Session

- (instancetype)init
{
  self = [super init];

  if (self)
  {
    _apiClient = [ApiClient new];

    // Start now and let run in background
    _tankerReadyPromise = [_apiClient getConfig].then(^(NSDictionary* config) {
      NSString* appId = config[@"appId"];
      NSLog(@"Using app ID: %@", appId);

      TKRTankerOptions* opts = [TKRTankerOptions options];
      opts.trustchainID = appId;
      opts.writablePath = getWritablePath();

      NSString* url = config[@"url"];
      if (url && url.length > 0)
      {
        opts.trustchainURL = url;
      }

      PMKTanker* tanker = [PMKTanker tankerWithOptions:opts];

      NSLog(@"Tanker initialized");
      self.tanker = tanker;
      return tanker;
    });
  }

  return self;
}

+ (Session*)sharedSession
{
  static Session* sharedSession = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedSession = [Session new];
  });
  return sharedSession;
}

- (PMKPromise<PMKTanker*>*)tankerReady
{
  return self.tankerReadyPromise;
}

- (PMKPromise*)signUpWithEmail:(NSString*)email password:(NSString*)password
{
  return [self tankerReady]
      .then(^() {
        return [self.apiClient signUpWithEmail:email password:password];
      })
      .then(^(NSDictionary* user) {
        return [self.tanker startWithIdentity:user[@"identity"]].then(^(NSNumber* status) {
          assert(status.unsignedIntegerValue == TKRStatusIdentityRegistrationNeeded);

          return [self.tanker registerIdentityWithVerification:[TKRVerification verificationFromPassphrase:password]];
        });
      });
}

- (PMKPromise*)logInWithEmail:(NSString*)email password:(NSString*)password
{
  return [self tankerReady]
      .then(^{
        return [self.apiClient logInWithEmail:email password:password];
      })
      .then(^(NSDictionary* user) {
        return [self.tanker startWithIdentity:user[@"identity"]].then(^(NSNumber* status) {
          switch (status.unsignedIntegerValue)
          {
          case TKRStatusReady:
            return [PMKPromise promiseWithValue:nil];
          case TKRStatusIdentityVerificationNeeded:
            return [self.tanker verifyIdentityWithVerification:[TKRVerification verificationFromPassphrase:password]];
          default:
            return [PMKPromise promiseWithValue:[NSError errorWithDomain:@"io.tanker.notepad"
                                                                    code:1
                                                                userInfo:@{
                                                                  NSLocalizedDescriptionKey : [NSString
                                                                      stringWithFormat:@"Got unexpected status: %lu",
                                                                                       status.unsignedIntegerValue]
                                                                }]];
          }
        });
      });
}

- (PMKPromise*)changePasswordFrom:(NSString*)oldPassword to:(NSString*)newPassword
{
  return [self.apiClient changePasswordFrom:oldPassword to:newPassword]
      .then(^{
        return [self tankerReady];
      })
      .then(^{
        return [self.tanker setVerificationMethod:[TKRVerification verificationFromPassphrase:newPassword]];
      });
}

- (PMKPromise*)logout
{
  return [self.apiClient logout]
      .then(^{
        return [self tankerReady];
      })
      .then(^{
        return [self.tanker stop];
      });
}

- (PMKPromise<NSDictionary*>*)getMe
{
  return [self.apiClient getMe];
}

- (PMKPromise<NSArray*>*)getUsers
{
  return [self.apiClient getUsers];
}

- (PMKPromise<NSString*>*)getData
{
  return [self getDataFromUser:self.apiClient.currentUserId];
}

- (PMKPromise<NSString*>*)getDataFromUser:(NSString*)userId
{
  return [self tankerReady]
      .then(^() {
        return [self.apiClient getDataFromUser:userId];
      })
      .then(^(NSString* b64EncryptedData) {
        NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
        return [self.tanker decryptStringFromData:encryptedData];
      });
}

- (PMKPromise<NSArray*>*)emailsToRecipients:(NSArray<NSString*>*)emails
{
  if (!emails || emails.count == 0)
  {
    return [PMKPromise promiseWithValue:@[]];
  }

  return [self getUsers].then(^(NSArray* users) {
    NSMutableArray<Recipient*>* res = [NSMutableArray new];

    for (NSString* email in emails)
    {
      NSPredicate* predicate = [NSPredicate predicateWithFormat:@"email==%@", email];
      NSArray* results = [users filteredArrayUsingPredicate:predicate];

      if ([results count] == 1)
      {
        Recipient* recipient = [Recipient recipientWithDictionary:results[0]];
        [res addObject:recipient];
      }
      else
      {
        NSString* errDesc = [@"User id not found for email: " stringByAppendingString:email];
        NSString* domain = @"io.tanker.notepad";
        NSDictionary* userInfo = @{NSLocalizedDescriptionKey : errDesc};
        NSError* err = [[NSError alloc] initWithDomain:domain code:1 userInfo:userInfo];
        return [PMKPromise promiseWithValue:err];
      }
    }

    return [PMKPromise promiseWithValue:res];
  });
}

- (PMKPromise*)putData:(NSString*)data
{
  return [self putData:data shareWith:@[]];
}

- (PMKPromise*)putData:(NSString*)data shareWith:(NSArray<NSString*>*)recipientEmails
{
  return [self tankerReady]
      .then(^() {
        return [self emailsToRecipients:recipientEmails];
      })
      .then(^(NSArray<Recipient*>* recipients) {
        TKREncryptionOptions* encryptOptions = [TKREncryptionOptions options];
        __block NSMutableArray<NSString*>* recipientsIdentities = [[NSMutableArray alloc] init];
        [recipients enumerateObjectsUsingBlock:^(Recipient* _Nonnull recipient, NSUInteger idx, BOOL* _Nonnull stop) {
          NSString* identity = recipient.publicIdentity;
          [recipientsIdentities addObject:identity];
        }];
        encryptOptions.shareWithUsers = recipientsIdentities;
        [self.tanker encryptDataFromString:data options:encryptOptions]
            .then(^(NSData* encryptedData) {
              NSString* b64EncryptedData = [encryptedData base64EncodedStringWithOptions:0];
              return [self.apiClient putData:b64EncryptedData];
            })
            .then(^{
              NSLog(@"Data encrypted and sent to server");
              NSMutableArray* recipientIds = [[NSMutableArray alloc] init];
              [recipients
                  enumerateObjectsUsingBlock:^(Recipient* _Nonnull recipient, NSUInteger idx, BOOL* _Nonnull stop) {
                    NSString* recipientId = recipient.userId;
                    [recipientIds addObject:recipientId];
                  }];
              NSLog(@"Sharing data with %@", recipientIds); // if empty, will "unshare"
              return [self.apiClient shareWith:recipientIds];
            })
            .catch(^(NSError* error) {
              NSLog(@"Could not encrypt: %@", [error localizedDescription]);
            });
      });
}

@end
