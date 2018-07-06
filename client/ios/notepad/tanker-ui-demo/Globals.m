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

+ (PMKPromise*)fetchUserToken:(NSString*)method userId:(NSString*)userId password:(NSString*)password
{
  [Globals sharedInstance]->_userId = userId;
  [Globals sharedInstance]->_password = password;
  
  NSString* urlStr = [NSString stringWithFormat:@"%@%@?userId=%@&password=%@", [Globals sharedInstance].serverAddress, method, userId, password];
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:urlStr]];
  [request setHTTPMethod:@"GET"];
  [request setValue:@"text/plain" forHTTPHeaderField:@"Content-Type"];
  
  NSURLSession *session = [NSURLSession sharedSession];
  
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve){
    [[session dataTaskWithRequest:request
                completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                  if (error)
                    resolve(error);
                  else
                  {
                  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
                  long statusCode = (long)[httpResponse statusCode];
                  if(statusCode != 200 && statusCode != 201)
                  {
                    NSLog(@"Invalid status code: %ld", (long)[httpResponse statusCode]);
                    resolve([[NSError alloc] initWithDomain:@"io.tanker.ui-demo" code:(long)[httpResponse statusCode] userInfo:nil]);
                  }
                  else
                    resolve([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
                  }
                }] resume];
  }];
}

+ (PMKPromise*) dataFromServer
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  NSString* urlStr = [NSString stringWithFormat:@"%@data/%@?userId=%@&password=%@", [Globals sharedInstance].serverAddress, userId, userId, password];
  NSLog(@"Request: GET: %@", urlStr);

  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:urlStr]];
  [request setHTTPMethod:@"GET"];
  [request setValue:@"text/plain" forHTTPHeaderField:@"Content-Type"];
  NSURLSession *session = [NSURLSession sharedSession];
  
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve){
    [[session dataTaskWithRequest:request
                completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                  if (error)
                    resolve(error);
                  else
                  {
                  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
                  if ((long)[httpResponse statusCode] != 200)
                  {
                    NSLog(@"Response status code: %ld", (long)[httpResponse statusCode]);
                    resolve([[NSError alloc] initWithDomain:@"io.tanker.ui-demo" code:(long)[httpResponse statusCode] userInfo:nil]);
                  }
                    else
                  resolve(data);
                  }
      }] resume];
  }];
}

+ (PMKPromise*) uploadToServer:(NSData*)encryptedData
{
  NSString* userId = [Globals sharedInstance]->_userId;
  NSString* password = [Globals sharedInstance]->_password;
  NSString* urlStr = [NSString stringWithFormat:@"%@%@?userId=%@&password=%@", [Globals sharedInstance].serverAddress, @"data", userId, password];
  NSLog(@"Request: PUT: %@", urlStr);
  
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:urlStr]];
  [request setHTTPMethod:@"PUT"];
  [request setValue:@"text/plain" forHTTPHeaderField:@"Content-Type"];
  NSString *postLength = [NSString stringWithFormat:@"%lu",[encryptedData length]];
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
  
  //NSLog(@"Length: %@, data: %@", postLength, [[NSString alloc] initWithData:encryptedData encoding:NSASCIIStringEncoding]);
  
  [request setHTTPBody:encryptedData];
  NSURLSession *session = [NSURLSession sharedSession];
  
  return [PMKPromise promiseWithResolver:^(PMKResolver resolve){
    [[session dataTaskWithRequest:request
                completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                  if (error)
                    resolve(error);
                  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
                  if ((long)[httpResponse statusCode] != 200)
                  {
                    NSLog(@"Response status code: %ld", (long)[httpResponse statusCode]);
                    resolve([[NSError alloc] initWithDomain:@"io.tanker.ui-demo" code:(long)[httpResponse statusCode] userInfo:nil]);
                  }
                  resolve(nil);
                }] resume];
  }];
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
