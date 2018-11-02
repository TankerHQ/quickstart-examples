#import "MyNoteViewController.h"
#import "StringValidator.h"

@import PromiseKit;

@interface MyNoteViewController ()
@property UIActivityIndicatorView* activityIndicator;

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

  _activityIndicator = [[UIActivityIndicatorView alloc]
      initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];

  [_activityIndicator startAnimating];

  [[self session] getData].then(^(NSString* clearText) {
    self.secretNotesField.text = clearText;
    [self.activityIndicator stopAnimating];
  })
  .catch(^(NSError* error) {
    [self.activityIndicator stopAnimating];
    // TODO constant
    if ([error.domain isEqualToString:@"io.notepad"] && error.code == 404)
      self.secretNotesField.text = @"";
  });
}

- (IBAction)saveNotes:(UIButton*)sender
{
  [_activityIndicator startAnimating];

  NSString* recipientEmail = [StringValidator trim:_shareWithField.text];

  NSMutableArray<NSString *> *recipientEmails = [NSMutableArray new];
  if (recipientEmail.length > 0) {
    [recipientEmails addObject:recipientEmail];
  }

  NSString *text = self.secretNotesField.text;

  [[self session] putData:text shareWith:recipientEmails].then(^{
    [self.activityIndicator stopAnimating];
  })
  .catch(^(NSError* error) {
    [self.activityIndicator stopAnimating];
    NSLog(@"Failed to encrypt or send data to server: %@", [error localizedDescription]);
  });
}

@end
