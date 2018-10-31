#import "AuthenticatedViewController.h"
#import "NoteTableViewItem.h"

NS_ASSUME_NONNULL_BEGIN

@interface SharedNoteDetailsViewController : AuthenticatedViewController

@property (strong, nonatomic) NoteTableViewItem *note;

@end

NS_ASSUME_NONNULL_END
