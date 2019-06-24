#import "MyNoteViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface MyNoteViewController ()

@property(weak, nonatomic) IBOutlet UITextView* secretNotesField;
@property(weak, nonatomic) IBOutlet UITextField* shareWithField;
@property(weak, nonatomic) IBOutlet UILabel* errorLabel;

@end

@implementation MyNoteViewController

- (void)viewDidLoad
{
  self.navbarTitle = @"My note";

  [super viewDidLoad];

  self.secretNotesField.textContainer.maximumNumberOfLines = 15;

  [[self session] getData]
      .then(^(NSString* clearText) {
        self.secretNotesField.text = clearText;
      })
      .catch(^(NSError* error) {
        if ([error.domain isEqualToString:@"io.tanker.notepad"] && error.code == 404)
        {
          self.secretNotesField.text = @"";
          return;
        }

        [SVProgressHUD showErrorWithStatus:@"Failed to load or decrypt your note"];
        [SVProgressHUD dismissWithDelay:5.0];
      });
}

- (IBAction)saveNotes:(UIButton*)sender
{
  [SVProgressHUD showWithStatus:@"Saving note..."];

  NSString* recipientEmail = [StringValidator trim:self.shareWithField.text];

  NSMutableArray<NSString*>* recipientEmails = [NSMutableArray new];
  if (recipientEmail.length > 0)
  {
    [recipientEmails addObject:recipientEmail];
  }

  NSString* text = self.secretNotesField.text;

  [[self session] putData:text shareWith:recipientEmails]
      .then(^{
        [SVProgressHUD showSuccessWithStatus:@"Note saved"];
        [SVProgressHUD dismissWithDelay:2.0];
      })
      .catch(^(NSError* error) {
        [SVProgressHUD showErrorWithStatus:@"Failed to encrypt or send data to server"];
        [SVProgressHUD dismissWithDelay:2.0];
        NSLog(@"Failed to encrypt or send data to server: %@", [error localizedDescription]);
      });
}

@end
