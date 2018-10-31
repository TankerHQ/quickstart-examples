#import "SharedNoteDetailsViewController.h"
#import "Globals.h"

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
  
  [Globals getDataFromUser:_note.authorId].then(^(NSString* b64EncryptedData) {
    NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
    return [[Globals sharedInstance].tanker decryptStringFromData:encryptedData].then(^(NSString* clearText) {
      self.noteBody.text = clearText;
    });
  })
  .catch(^(NSError* error) {
    NSLog(@"Could not load data from server: %@", [error localizedDescription]);
  });
}

@end
