#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NoteTableViewItem : NSObject

- (instancetype)init:(NSDictionary*)data;

@property NSString* authorId;
@property NSString* authorEmail;

@end

NS_ASSUME_NONNULL_END
