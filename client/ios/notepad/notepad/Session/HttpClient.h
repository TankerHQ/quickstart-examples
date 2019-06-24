#import <Foundation/Foundation.h>

@import PromiseKit;

NS_ASSUME_NONNULL_BEGIN

@interface HttpClient : NSObject

- (instancetype)initWithRoot:(NSString*)root;
- (PMKPromise*)getWithPath:(NSString*)path;
- (PMKPromise*)postWithPath:(NSString*)path body:(NSData*)body contentType:(NSString*)contentType;
- (PMKPromise*)putWithPath:(NSString*)path body:(NSData*)body contentType:(NSString*)contentType;

@end

NS_ASSUME_NONNULL_END
