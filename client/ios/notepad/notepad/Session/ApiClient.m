#import "ApiClient.h"
#import "HttpClient.h"

NSString* (^toString)(NSData*) = ^(NSData *data) {
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
};

PMKPromise<NSArray*>* (^jsonToArray)(NSData*) = ^(NSData *json) {
  NSError *err = nil;
  NSArray *array = [NSJSONSerialization
                    JSONObjectWithData:json
                    options:NSJSONReadingAllowFragments
                    error:&err];
  if (err) {
    return [PMKPromise promiseWithValue:err];
  }
  return [PMKPromise promiseWithValue:array];
};

PMKPromise<NSDictionary*>* (^jsonToDict)(NSData*) = ^(NSData *json) {
  NSError *err = nil;
  NSDictionary *dict = [NSJSONSerialization
                        JSONObjectWithData:json
                        options:NSJSONReadingAllowFragments
                        error:&err];
  if (err) {
    return [PMKPromise promiseWithValue:err];
  }
  return [PMKPromise promiseWithValue:dict];
};

PMKPromise<NSData*>* (^dictToJson)(NSDictionary*) = ^(NSDictionary *data) {
  NSError *err = nil;
  NSData *json = [NSJSONSerialization dataWithJSONObject:data options:0 error:&err];
  if (err) {
    return [PMKPromise promiseWithValue:err];
  }
  return [PMKPromise promiseWithValue:json];
};


@interface ApiClient ()

@property (readonly) HttpClient* httpClient;
@property (nullable) NSString *currentUserId;
@property (nullable) NSString *currentUserEmail;

@end

@implementation ApiClient

- (id)init {
  self = [super init];

  if (self) {
    // Get configuration settings from Info.plist
    NSString *path = [[NSBundle mainBundle] pathForResource:@"Info" ofType:@"plist"];
    NSDictionary *settings = [[NSDictionary alloc] initWithContentsOfFile:path];
    _httpClient = [[HttpClient alloc] initWithRoot:settings[@"ServerAddress"]];
  }

  return self;
}

- (PMKPromise<NSDictionary *> *)authenticateWithPath:(NSString *)path
                                               email:(NSString *)email
                                            password:(NSString *)password {
  return dictToJson(@{@"email": email, @"password": password})
    .then(^(NSData *jsonBody) {
      return [self.httpClient postWithPath:path body:jsonBody contentType:@"application/json"];
    })
    .then(jsonToDict)
    .then(^(NSDictionary* user) {
      self.currentUserId = user[@"id"];
      self.currentUserEmail = user[@"email"];
      return user;
    });
}

- (PMKPromise<NSDictionary *> *)logInWithEmail:(NSString *)email
                                      password:(NSString *)password {
  return [self authenticateWithPath:@"login" email:email password:password];
}

- (PMKPromise<NSDictionary *> *)signUpWithEmail:(NSString *)email
                                       password:(NSString *)password {
  return [self authenticateWithPath:@"signup" email:email password:password];
}

- (PMKPromise *)changeEmail:(NSString *)newEmail {
  return dictToJson(@{@"email": newEmail})
    .then(^(NSData *jsonBody) {
      return [self.httpClient putWithPath:@"me/email" body:jsonBody contentType:@"application/json"];
    }).then(^{
      self.currentUserEmail = newEmail;
    });
}

- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword {
  return dictToJson(@{@"oldPassword": oldPassword, @"newPassword": newPassword})
    .then(^(NSData *jsonBody) {
      return [self.httpClient putWithPath:@"me/password" body:jsonBody contentType:@"application/json"];
    });
}

- (PMKPromise<NSString *> *)resetPasswordTo:(NSString *)newPassword
                                  withToken:(NSString *)resetToken {
  return dictToJson(@{@"newPassword": newPassword, @"passwordResetToken": resetToken})
    .then(^(NSData *jsonBody) {
      return [self.httpClient postWithPath:@"resetPassword" body:jsonBody contentType:@"application/json"];
    })
    .then(jsonToDict)
    .then(^(NSDictionary* user) {
      return user[@"email"];
    });
}

- (PMKPromise *)requestResetPassword:(NSString *)email {
  return dictToJson(@{@"email": email})
    .then(^(NSData *jsonBody) {
      return [self.httpClient postWithPath:@"requestResetPassword" body:jsonBody contentType:@"application/json"];
    });
}

- (PMKPromise*)logout {
  return [self.httpClient getWithPath:@"logout"].then(^{
    self.currentUserId = nil;
    self.currentUserEmail = nil;
  });
}

- (PMKPromise<NSDictionary*>*)getConfig {
  return [self.httpClient getWithPath:@"config"].then(jsonToDict);
}

- (PMKPromise<NSDictionary*>*)getMe {
  return [self.httpClient getWithPath:@"me"].then(jsonToDict);
}

- (PMKPromise<NSArray*>*)getUsers {
  return [self.httpClient getWithPath:@"users"].then(jsonToArray);
}

- (PMKPromise<NSString*>*)getDataFromUser:(NSString*)userId {
  NSString *path = [@"data" stringByAppendingPathComponent:userId];
  return [self.httpClient getWithPath:path].then(toString);
}

- (PMKPromise *)putData:(NSString*)data {
  NSData *body = [data dataUsingEncoding:NSUTF8StringEncoding];
  return [self.httpClient putWithPath:@"data" body:body contentType:@"text/plain"];
}

- (PMKPromise *)shareWith:(NSArray<NSString *> *)recipients {
  return dictToJson(@{@"from": self.currentUserId, @"to": recipients})
    .then(^(NSData *jsonBody) {
      return [self.httpClient postWithPath:@"share" body:jsonBody contentType:@"application/json"];
    });
}

@end
