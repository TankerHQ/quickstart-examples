#import "NoteTableViewItem.h"

@implementation NoteTableViewItem

- (instancetype)init:(NSDictionary*)data {
  self.authorEmail = data[@"email"];
  self.authorId = data[@"id"];
  return self;
}

@end
