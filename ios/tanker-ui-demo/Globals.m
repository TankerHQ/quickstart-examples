//
//  Globals.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "Globals.h"
@import PromiseKit;

@implementation Globals

@synthesize tanker = _tanker;
@synthesize serverAddress = _serverAdress;

NSString* getWritablePath()
{
  NSArray* paths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
  NSString* libraryDirectory = [paths objectAtIndex:0];
  return libraryDirectory;
}

- (void)initTanker
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  opts.trustchainID = @"oQl8PAuWb3uNO2hjoMU8nSJPG3nMXwy9L+WKLxkQ7z4=";
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
  NSString* urlStr = [NSString stringWithFormat:@"%@%@?userId=%@&password=%@", [Globals sharedInstance].serverAddress, method, userId, password];
  NSLog(@"%@", urlStr);
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc]
                                  initWithURL:[NSURL URLWithString:urlStr]];
  [request setHTTPMethod:@"GET"];
  [request setValue:@"text" forHTTPHeaderField:@"Content-Type"];
  
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
                    resolve(error);
                  }
                  resolve([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
                }] resume];
  }];
}

- (id)init {
  self = [super init];
  if (self) {
    [self initTanker];
    [self setServerAddress:@"http://10.208.24.87:8080/"];
  }
  return self;
}

@end
