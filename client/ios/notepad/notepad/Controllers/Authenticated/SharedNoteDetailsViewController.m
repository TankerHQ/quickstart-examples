#import "SharedNoteDetailsViewController.h"

@import PromiseKit;

@interface SharedNoteDetailsViewController ()

@property(weak, nonatomic) IBOutlet UILabel* noteTitle;
@property(weak, nonatomic) IBOutlet UITextView* noteBody;

@end

@implementation SharedNoteDetailsViewController

- (void)viewDidLoad
{
  self.navbarTitle = @"Shared note";
  self.navbarBackButton = YES;

  [super viewDidLoad];

  self.noteTitle.text = [NSString stringWithFormat:@"Note from %@", self.note.authorEmail];

  [[self session] getDataFromUser:self.note.authorId]
      .then(^(NSString* clearText) {
        self.noteBody.text = clearText;
      })
      .catch(^(NSError* error) {
        NSLog(@"Could not load data from server: %@", [error localizedDescription]);
      });
}

@end
