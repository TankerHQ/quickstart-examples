#import "SharedNoteDetailsViewController.h"

@import PromiseKit;

@interface SharedNoteDetailsViewController ()

@property (weak, nonatomic) IBOutlet UILabel *noteTitle;
@property (weak, nonatomic) IBOutlet UITextView *noteBody;

@end

@implementation SharedNoteDetailsViewController

- (void)viewDidLoad {
  self.navbarTitle = @"Shared note";
  self.navbarBackButton = YES;

  [super viewDidLoad];

  _noteTitle.text = [NSString stringWithFormat :@"Note from %@", _note.authorEmail];
  
  [[self session] getDataFromUser:_note.authorId].then(^(NSString* clearText) {
    self.noteBody.text = clearText;
  }).catch(^(NSError* error) {
    NSLog(@"Could not load data from server: %@", [error localizedDescription]);
  });
}

@end
