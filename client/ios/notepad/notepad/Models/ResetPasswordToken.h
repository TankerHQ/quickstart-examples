#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ResetPasswordToken : NSObject

@property(readonly) NSString* appToken;
@property(readonly) NSString* tankerToken;

- (instancetype)initFromLink:(NSString*)link;

@end

NS_ASSUME_NONNULL_END
