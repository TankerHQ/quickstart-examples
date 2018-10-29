#import "NoteTableViewCell.h"
#import "NoteTableViewItem.h"

@interface NoteTableViewCell ()
@end

@implementation NoteTableViewCell

- (void)configureWithItem:(NoteTableViewItem*)item {
  [self setAccessoryType:UITableViewCellAccessoryDisclosureIndicator];
  self.textLabel.text = [NSString stringWithFormat:@"Note from %@", item.authorEmail];
  self.textLabel.font = [self.textLabel.font fontWithSize:15];

}

+ (NSString*)identifier {
  return NSStringFromClass(self);
}

@end
