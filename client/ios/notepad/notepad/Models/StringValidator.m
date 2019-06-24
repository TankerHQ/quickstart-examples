#import "StringValidator.h"

@implementation StringValidator

+ (BOOL)isEmpty:(NSString*)string
{
  return string.length == 0;
}

+ (BOOL)isBlank:(NSString*)string
{
  return [self trim:string].length == 0;
}

+ (BOOL)isEmail:(NSString*)string
{
  {
    NSString* emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}";
    NSPredicate* emailTest = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
    return [emailTest evaluateWithObject:string];
  }
}

+ (BOOL)isURL:(NSString*)string
{
  NSURL* url = [NSURL URLWithString:string];
  return !!(url && url.scheme && url.host);
}

+ (NSString*)trim:(NSString*)string
{
  NSCharacterSet* cs = [NSCharacterSet whitespaceAndNewlineCharacterSet];
  return [string stringByTrimmingCharactersInSet:cs];
}

@end
