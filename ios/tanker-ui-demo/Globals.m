//
//  Globals.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "Globals.h"

@implementation Globals

@synthesize tanker = _tanker;

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

- (id)init {
  self = [super init];
  if (self) {
    [self initTanker];
  }
  return self;
}

@end
