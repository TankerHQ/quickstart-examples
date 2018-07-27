#import "Globals.h"
@import PromiseKit;

NSString *getWritablePath() {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory,
                                                       NSUserDomainMask, YES);
  NSString *libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
}

@implementation Globals

- (PMKPromise *)buildTanker {
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve) {
    if (self.tanker) {
      resolve(nil);
      return;
    }
    [self.class requestToServerWithMethod:@"GET"
                                     path:@"config"
                                queryArgs:[NSMutableDictionary dictionary]
                                     body:nil]
        .then(^(NSData *jsonConfig) {
          NSError *error = nil;
          id config = [NSJSONSerialization
              JSONObjectWithData:jsonConfig
                         options:NSJSONReadingAllowFragments
                           error:&error];
          self.trustchainId = [config objectForKey:@"trustchainId"];
          NSLog(@"trustchain ID: %@", self.trustchainId);
          TKRTankerOptions *opts = [TKRTankerOptions options];
          opts.trustchainID = self.trustchainId;
          opts.writablePath = getWritablePath();
          self.tanker = [TKRTanker tankerWithOptions:opts];

          NSLog(@"Tanker initialized");
          resolve(nil);
        });
  }];
}

+ (PMKPromise *)requestToServerWithMethod:(NSString *)method
                                     path:(NSString *)path
                                queryArgs:
                                    (NSDictionary<NSString *, NSString *> *)args
                                     body:(NSData *)body {
  return [self requestToServerWithMethod:method
                                    path:path
                               queryArgs:args
                                    body:body
                             contentType:@"text/plain"];
}

+ (PMKPromise *)requestToServerWithMethod:(NSString *)method
                                     path:(NSString *)path
                                queryArgs:
                                    (NSDictionary<NSString *, NSString *> *)args
                                     body:(NSData *)body
                              contentType:(NSString *)contentType {
  NSString *urlStr = [NSString
      stringWithFormat:@"%@%@", [Globals sharedInstance].serverAddress, path];
  if (args && args.count != 0) {
    urlStr = [urlStr stringByAppendingString:@"?"];
    for (NSString *key in args) {
      NSString *value = args[key];
      urlStr = [urlStr
          stringByAppendingString:[NSString
                                      stringWithFormat:@"%@=%@&", key, value]];
    }
    urlStr = [urlStr substringToIndex:urlStr.length - 1];
  }

  NSMutableURLRequest *request =
      [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:urlStr]];
  request.HTTPMethod = method;
  [request setValue:contentType forHTTPHeaderField:@"Content-Type"];
  NSString *postLength = [NSString stringWithFormat:@"%lu", body.length];
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
  request.HTTPBody = body;

  NSURLSession *session = [NSURLSession sharedSession];

  return [PMKPromise promiseWithResolver:^(PMKResolver resolve) {
    [[session dataTaskWithRequest:request
                completionHandler:^(NSData *_Nullable data,
                                    NSURLResponse *_Nullable response,
                                    NSError *_Nullable error) {
                  if (error)
                    resolve(error);
                  else {
                    NSHTTPURLResponse *httpResponse =
                        (NSHTTPURLResponse *)response;
                    if ((long)httpResponse.statusCode != 200 &&
                        (long)httpResponse.statusCode != 201) {
                      NSLog(@"Response status code: %ld",
                            (long)httpResponse.statusCode);
                      resolve([[NSError alloc]
                          initWithDomain:@"io.tanker.ui-demo"
                                    code:(long)httpResponse.statusCode
                                userInfo:nil]);
                    } else
                      resolve(data);
                  }
                }] resume];
  }];
}

+ (PMKPromise<NSString *> *)signupOrLoginWithEmail:(NSString *)email
                                          password:(NSString *)password
                                              path:(NSString *)path {
  Globals *inst = [Globals sharedInstance];

  inst.email = email;
  inst.password = password;

  return
      [Globals
          requestToServerWithMethod:@"GET"
                               path:path
                          queryArgs:@{@"email" : email, @"password" : password}
                               body:nil]
          .then(^(NSData *jsonUser) {
            // Get JSON data into a Foundation object
            NSError *error = nil;
            id user = [NSJSONSerialization
                JSONObjectWithData:jsonUser
                           options:NSJSONReadingAllowFragments
                             error:&error];

            NSString *id = [user objectForKey:@"id"];
            NSString *token = [user objectForKey:@"token"];

            inst.userId = id;

            return token;
          });
}

+ (PMKPromise<NSString *> *)signupWithEmail:(NSString *)email
                                   password:(NSString *)password {
  return
      [Globals signupOrLoginWithEmail:email password:password path:@"signup"];
}

+ (PMKPromise<NSString *> *)loginWithEmail:(NSString *)email
                                  password:(NSString *)password;
{
  return [Globals signupOrLoginWithEmail:email password:password path:@"login"];
}

+ (Globals *)sharedInstance {
  static dispatch_once_t onceToken;
  static Globals *instance = nil;
  dispatch_once(&onceToken, ^{
    instance = [[Globals alloc] init];
  });
  return instance;
}

+ (PMKPromise<NSString *> *)dataFromServer {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;
  NSString *userId = [Globals sharedInstance] -> _userId;

  return
      [Globals
          requestToServerWithMethod:@"GET"
                               path:[@"data"
                                        stringByAppendingPathComponent:userId]
                          queryArgs:@{@"email" : email, @"password" : password}
                               body:nil]
          .then(^(NSData *data) {
            return [[NSString alloc] initWithData:data
                                         encoding:NSUTF8StringEncoding];
          });
}

+ (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userIdFrom {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;

  return
      [Globals
          requestToServerWithMethod:@"GET"
                               path:[@"data" stringByAppendingPathComponent:
                                                 userIdFrom]
                          queryArgs:@{@"email" : email, @"password" : password}
                               body:nil]
          .then(^(NSData *data) {
            return [[NSString alloc] initWithData:data
                                         encoding:NSUTF8StringEncoding];
          });
}

+ (PMKPromise *)uploadToServer:(NSString *)data {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;

  NSData *body = [data dataUsingEncoding:NSUTF8StringEncoding];
  return [Globals
      requestToServerWithMethod:@"PUT"
                           path:@"data"
                      queryArgs:@{@"email" : email, @"password" : password}
                           body:body];
}

+ (PMKPromise *)changeEmail:(NSString *)newEmail {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;

  NSDictionary *body = @{@"email" : newEmail};
  NSError *err = nil;
  NSData *jsonBody =
      [NSJSONSerialization dataWithJSONObject:body options:0 error:&err];

  return
      [Globals
          requestToServerWithMethod:@"PUT"
                               path:@"me/email"
                          queryArgs:@{@"email" : email, @"password" : password}
                               body:jsonBody
                        contentType:@"application/json"]
          .then(^{
            [Globals sharedInstance] -> _email = newEmail;
          });
}

+ (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;

  NSDictionary *body =
      @{@"oldPassword" : oldPassword, @"newPassword" : newPassword};
  NSError *err = nil;
  NSData *jsonBody =
      [NSJSONSerialization dataWithJSONObject:body options:0 error:&err];

  return
      [Globals
          requestToServerWithMethod:@"PUT"
                               path:@"me/password"
                          queryArgs:@{@"email" : email, @"password" : password}
                               body:jsonBody
                        contentType:@"application/json"]
          .then(^{
            [Globals sharedInstance] -> _password = newPassword;
          });
}

+ (PMKPromise *)shareNoteFrom:(NSString *)userId
                           to:(NSArray<NSString *> *)recipients {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;

  NSDictionary *body = @{@"from" : userId, @"to" : recipients};
  NSError *err = nil;
  NSData *jsonBody =
      [NSJSONSerialization dataWithJSONObject:body options:0 error:&err];

  return [Globals
      requestToServerWithMethod:@"POST"
                           path:@"share"
                      queryArgs:@{@"email" : email, @"password" : password}
                           body:jsonBody
                    contentType:@"application/json"];
}

+ (PMKPromise<NSArray<id> *> *)getUsers {
  NSString *email = [Globals sharedInstance] -> _email;
  NSString *password = [Globals sharedInstance] -> _password;

  return
      [Globals
          requestToServerWithMethod:@"GET"
                               path:@"users"
                          queryArgs:@{@"email" : email, @"password" : password}
                               body:nil]
          .then(^(NSData *jsonUsers) {
            // Get JSON data into a Foundation object
            NSError *error = nil;
            NSArray<id> *users = [NSJSONSerialization
                JSONObjectWithData:jsonUsers
                           options:NSJSONReadingAllowFragments
                             error:&error];
            return users;
          });
}

- (id)init {
  self = [super init];
  if (self) {
    // Get configuration settings from Info.plist
    NSString *path =
        [[NSBundle mainBundle] pathForResource:@"Info" ofType:@"plist"];
    NSDictionary *settings = [[NSDictionary alloc] initWithContentsOfFile:path];

    self.trustchainId = [settings valueForKey:@"TrustchainId"];
    self.serverAddress = [settings valueForKey:@"ServerAddress"];
  }
  return self;
}

@end
