//
//  Globals.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "Globals.h"
@import PromiseKit;

@interface Globals()

@property NSString* userId;
@property NSString* password;
@property NSString* trustchainId;

@end

@implementation Globals

NSString* getWritablePath()
{
  NSArray* paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
  NSString* libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
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

- (void)initTanker
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  opts.trustchainID = _trustchainId;
  opts.writablePath = getWritablePath();
  [self setTanker:[TKRTanker tankerWithOptions:opts]];
  NSLog(@"Tanker initialization sucessful");
}

+ (Globals *)sharedInstance {
  static dispatch_once_t onceToken;
  static Globals *instance = nil;
  dispatch_once(&onceToken, ^{
    instance = [[Globals alloc] init];
  });
  return instance;
}

+ (PMKPromise<NSString*>*)fetchUserToken:(NSString*)serverPath userId:(NSString*)userId password:(NSString*)password
{
  [Globals sharedInstance]->_userId = userId;
  [Globals sharedInstance]->_password = password;
  
  return [Globals requestToServerWithMethod:@"GET" path:serverPath queryArgs:@{@"userId": userId, @"password": password} body:nil].then(^(NSData* data){
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  });
}

+ (PMKPromise<NSData*>*) dataFromServer
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"GET" path:[@"data" stringByAppendingPathComponent:userId] queryArgs:@{@"userId": userId, @"password": password} body:nil];
}

+ (PMKPromise<NSData*>*) getDataFromUser:(NSString*)userIdFrom
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"GET" path:[@"data" stringByAppendingPathComponent:userIdFrom] queryArgs:@{@"userId": userId, @"password": password} body:nil];
}

+ (PMKPromise*) uploadToServer:(NSData*)encryptedData
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"PUT" path:@"data" queryArgs:@{@"userId": userId, @"password": password} body:encryptedData];
}

+ (PMKPromise*)changePassword:(NSString*)newPassword
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  
  return [Globals requestToServerWithMethod:@"PUT" path:@"password" queryArgs:@{@"userId": userId, @"password": password, @"newPassword": newPassword} body:nil];
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
    _trustchainId = [settings valueForKey:@"TrustchainId"];
    
    [self initTanker];
    [self setServerAddress:[settings valueForKey:@"ServerAddress"]];
  }
  return self;
}

@end
