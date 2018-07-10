#import "Globals.h"
@import PromiseKit;

NSString* getWritablePath()
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
  NSString *libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
}

@implementation Globals

- (void) initTanker
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  opts.trustchainID = self.trustchainId;
  opts.writablePath = getWritablePath();
  self.tanker = [TKRTanker tankerWithOptions:opts];
  NSLog(@"trustchain ID: %@", opts.trustchainID);
}

+ (PMKPromise*) requestToServerWithMethod:(NSString*)method path:(NSString*)path queryArgs:(NSDictionary<NSString*, NSString*>*)args body:(NSData*)body
{
  return [self requestToServerWithMethod:method path:path queryArgs:args body:body contentType:@"text/plain"];
}

+ (PMKPromise*) requestToServerWithMethod:(NSString*)method path:(NSString*)path queryArgs:(NSDictionary<NSString*, NSString*>*)args body:(NSData*)body contentType:(NSString*)contentType
{
  NSString* urlStr = [NSString stringWithFormat:@"%@%@", [Globals sharedInstance].serverAddress, path];
  if (args && args.count != 0)
  {
    urlStr = [urlStr stringByAppendingString:@"?"];
    for (NSString* key in args)
    {
      NSString* value = args[key];
      urlStr = [urlStr stringByAppendingString:[NSString stringWithFormat:@"%@=%@&", key, value]];
    }
    urlStr = [urlStr substringToIndex:urlStr.length - 1];
  }
  
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:urlStr]];
  request.HTTPMethod = method;
  [request setValue:contentType forHTTPHeaderField:@"Content-Type"];
  NSString* postLength = [NSString stringWithFormat:@"%lu",body.length];
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
  request.HTTPBody = body;
  
  NSURLSession *session = [NSURLSession sharedSession];
  
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve){
    [[session dataTaskWithRequest:request
                completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                  if (error)
                    resolve(error);
                  else
                  {
                  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
                  if ((long)httpResponse.statusCode != 200 && (long)httpResponse.statusCode != 201)
                  {
                    NSLog(@"Response status code: %ld", (long)httpResponse.statusCode);
                    resolve([[NSError alloc] initWithDomain:@"io.tanker.ui-demo" code:(long)httpResponse.statusCode userInfo:nil]);
                  }
                  else
                    resolve(data);
                  }
                }] resume];
  }];
}

+ (PMKPromise<NSString*>*)signupOrLoginWithUserId:(NSString*)userId password:(NSString*)password path:(NSString*)path
{
  Globals* inst = [Globals sharedInstance];
  
  inst.userId = userId;
  inst.password = password;
  return [Globals requestToServerWithMethod:@"GET" path:path queryArgs:@{@"userId": userId, @"password": password} body:nil].then(^(NSData* token) {
    return [[NSString alloc] initWithData:token encoding:NSUTF8StringEncoding];
  });
}

+ (PMKPromise<NSString*>*)signupWithUserId:(NSString*)userId password:(NSString*)password
{
  return [Globals signupOrLoginWithUserId:userId password:password path:@"signup"];
}

+ (PMKPromise<NSString*>*)loginWithUserId:(NSString*)userId password:(NSString*)password;
{
  return [Globals signupOrLoginWithUserId:userId password:password path:@"login"];
}

+ (Globals *)sharedInstance {
  static dispatch_once_t onceToken;
  static Globals *instance = nil;
  dispatch_once(&onceToken, ^{
    instance = [[Globals alloc] init];
  });
  return instance;
}

+ (PMKPromise<NSString*>*) dataFromServer
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"GET" path:[@"data" stringByAppendingPathComponent:userId] queryArgs:@{@"userId": userId, @"password": password} body:nil].then(^(NSData* data) {
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  });
}

+ (PMKPromise<NSString*>*) getDataFromUser:(NSString*)userIdFrom
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"GET" path:[@"data" stringByAppendingPathComponent:userIdFrom] queryArgs:@{@"userId": userId, @"password": password} body:nil].then(^(NSData* data) {
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  });
}

+ (PMKPromise*) uploadToServer:(NSString*)data
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  NSData* body = [data dataUsingEncoding:NSUTF8StringEncoding];
  return [Globals requestToServerWithMethod:@"PUT" path:@"data" queryArgs:@{@"userId": userId, @"password": password} body:body];
}

+ (PMKPromise*)changePassword:(NSString*)newPassword
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* oldPassword = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"PUT" path:@"password" queryArgs:@{@"userId": userId, @"password": oldPassword, @"newPassword": newPassword} body:nil].then(^{
    [Globals sharedInstance]->_password = newPassword;
  });
}

+ (PMKPromise*)shareNoteWith:(NSArray<NSString*>*)recipients
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  NSDictionary* body = @{@"from": userId, @"to": recipients};
  NSError* err = nil;
  NSData* jsonBody = [NSJSONSerialization dataWithJSONObject:body options:0 error:&err];
  
  return [Globals requestToServerWithMethod:@"POST" path:@"share" queryArgs:@{@"userId": userId, @"password": password} body:jsonBody contentType:@"application/json"];
}


- (id)init {
  self = [super init];
  if (self) {
    // Get configuration settings from Info.plist
    NSString *path = [[NSBundle mainBundle] pathForResource:@"Info" ofType:@"plist"];
    NSDictionary *settings = [[NSDictionary alloc] initWithContentsOfFile:path];
    
    self.trustchainId = [settings valueForKey:@"TrustchainId"];
    self.serverAddress = [settings valueForKey:@"ServerAddress"];
    [self initTanker];
  }
  return self;
}

@end
