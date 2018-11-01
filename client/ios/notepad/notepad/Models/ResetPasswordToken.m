#import "ResetPasswordToken.h"

@implementation ResetPasswordToken

// example link: <protocol>://<domain>/confirm-password-reset#<app-token>:<tanker-token>
- (instancetype)initFromLink:(NSString *)link {
  self = [super init];

  if (self) {
    NSString *hash = [link componentsSeparatedByString:@"#"][1];
    NSArray *tokens = [hash componentsSeparatedByString:@":"];
    _appToken = tokens[0];
    _tankerToken = tokens[1];
  }

  return self;
}

@end
