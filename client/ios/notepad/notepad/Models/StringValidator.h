#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface StringValidator : NSObject

+ (BOOL) isEmpty:(NSString *)string;
+ (BOOL) isBlank:(NSString *)string;
+ (BOOL) isEmail:(NSString *)string;
+ (BOOL) isURL:(NSString *)string;
+ (NSString *)trim:(NSString *)string;

@end

NS_ASSUME_NONNULL_END
