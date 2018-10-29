#import "Globals.h"
#import "ApiClient.h"

@import PromiseKit;

NSString *getWritablePath() {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory,
                                                       NSUserDomainMask, YES);
  NSString *libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
}

@interface Globals ()

@property ApiClient* apiClient;

@end

@implementation Globals

- (PMKPromise *)buildTanker {
  if (self.tanker) {
    return [PMKPromise promiseWithValue:nil];
  }

  return [self.apiClient getConfig].then(^(NSDictionary* config) {
    NSString *trustchainId = [config objectForKey:@"trustchainId"];
    NSLog(@"trustchain ID: %@", trustchainId);

    TKRTankerOptions *opts = [TKRTankerOptions options];
    opts.trustchainID = trustchainId;
    opts.writablePath = getWritablePath();

    self.tanker = [TKRTanker tankerWithOptions:opts];

    NSLog(@"Tanker initialized");
  });
}

- (PMKPromise<NSString *> *)authenticateWithPath:(NSString *)path
                                           email:(NSString *)email
                                        password:(NSString *)password {
  self.email = email;

  return [self.apiClient authenticateWithPath:path email:email password:password].then(^(NSDictionary *user) {
    NSString *userId = [user objectForKey:@"id"];
    NSString *userToken = [user objectForKey:@"token"];

    self.userId = userId;

    return userToken;
  });
}

- (PMKPromise<NSString *> *)signUpWithEmail:(NSString *)email
                                   password:(NSString *)password {
  return [self authenticateWithPath:@"signup" email:email password:password];
}

- (PMKPromise<NSString *> *)logInWithEmail:(NSString *)email
                                  password:(NSString *)password {
  return [self authenticateWithPath:@"login" email:email password:password];
}

- (PMKPromise *)changeEmail:(NSString *)newEmail {
  return [self.apiClient changeEmail:newEmail].then(^{
    self.email = newEmail;
  });
}

- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword {
  return [self.apiClient changePasswordFrom:oldPassword to:newPassword];
}

- (PMKPromise *)logout {
  return [self.apiClient logout].then(^{
    return [self.tanker close];
  });
}

+ (Globals *)sharedInstance {
  static dispatch_once_t onceToken;
  static Globals *instance = nil;
  dispatch_once(&onceToken, ^{
    instance = [[Globals alloc] init];
  });
  return instance;
}

- (PMKPromise<NSDictionary *> *)getMe {
  return [self.apiClient getMe];
}

- (PMKPromise<NSArray*> *)getUsers {
  return [self.apiClient getUsers];
}

- (PMKPromise<NSString *> *)getData {
  NSString *userId = [Globals sharedInstance] -> _userId;
  return [self.apiClient getDataFromUser:userId];
}

- (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userIdFrom {
  return [self.apiClient getDataFromUser:userIdFrom];
}

- (PMKPromise *)putData:(NSString *)data {
  return [self.apiClient putData:data];
}

- (PMKPromise *)shareTo:(NSArray<NSString *> *)recipients {
  return [self.apiClient shareTo:recipients];
}

- (id)init {
  self = [super init];

  if (self) {
    _apiClient = [ApiClient new];
  }

  return self;
}

@end
