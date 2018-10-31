#import <UIKit/UIKit.h>
#import "NoteTableViewItem.h"

NS_ASSUME_NONNULL_BEGIN

@interface NoteTableViewCell : UITableViewCell

+ (NSString*)identifier;

- (void)configureWithItem:(NoteTableViewItem*)item;

@end

NS_ASSUME_NONNULL_END
