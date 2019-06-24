#import "SharedNotesViewController.h"
#import "NoteTableViewCell.h"
#import "NoteTableViewItem.h"
#import "SharedNoteDetailsViewController.h"

@import PromiseKit;

@interface SharedNotesViewController ()

@property(weak, nonatomic) IBOutlet UITableView* tableView;
@property(weak, nonatomic) IBOutlet UILabel* tableTitle;
@property(weak, nonatomic) IBOutlet UIButton* refreshButton;
@property(strong, nonatomic) NSMutableArray<NoteTableViewItem*>* notes;

@end

@implementation SharedNotesViewController

- (void)viewDidLoad
{
  self.navbarTitle = @"Shared notes";

  [super viewDidLoad];

  self.tableView.delegate = self;
  self.tableView.dataSource = self;

  [self.refreshButton setTitle:@"Refresh" forState:UIControlStateNormal];
  [self refreshSharedNotes];
}

- (void)refreshSharedNotes
{
  self.notes = [NSMutableArray new];

  [[self session] getMe].then(^(NSDictionary* me) {
    NSArray* accessibleNotes = me[@"accessibleNotes"];

    for (NSDictionary* note in accessibleNotes)
    {
      NoteTableViewItem* item = [[NoteTableViewItem alloc] init:note];
      [self.notes addObject:item];
    }

    [self.tableView reloadData];

    self.tableTitle.text = [NSString stringWithFormat:@"Notes (%zd)", [self.notes count]];
  });
}

- (IBAction)triggerRefresh:(id)sender
{
  [self refreshSharedNotes];
}

- (UITableViewCell*)tableView:(UITableView*)tableView cellForRowAtIndexPath:(NSIndexPath*)indexPath
{
  UITableViewCell* cell = [self.tableView dequeueReusableCellWithIdentifier:NoteTableViewCell.identifier];

  if (!cell)
  {
    cell = [[NoteTableViewCell alloc] initWithStyle:UITableViewCellStyleDefault
                                    reuseIdentifier:NoteTableViewCell.identifier];
  }

  UIColor* oddRowColor =
      [UIColor colorWithRed:(247.0f / 255.0f) green:(247.0f / 255.0f) blue:(247.0f / 255.0f) alpha:1];
  UIColor* evenRowColor = [UIColor whiteColor];

  if (indexPath.row % 2 == 0)
  {
    cell.backgroundColor = evenRowColor;
  }
  else
  {
    cell.backgroundColor = oddRowColor;
  }

  return cell;
}

- (void)tableView:(UITableView*)tableView
      willDisplayCell:(UITableViewCell*)cell
    forRowAtIndexPath:(NSIndexPath*)indexPath
{
  [(NoteTableViewCell*)cell configureWithItem:self.notes[indexPath.item]];
}

- (NSInteger)tableView:(UITableView*)tableView numberOfRowsInSection:(NSInteger)section
{
  return [self.notes count];
}

- (void)tableView:(UITableView*)tableView didSelectRowAtIndexPath:(NSIndexPath*)indexPath
{
  [self performSegueWithIdentifier:@"detailsSegue" sender:indexPath];
  [self.tableView deselectRowAtIndexPath:indexPath animated:NO];
}

- (void)prepareForSegue:(UIStoryboardSegue*)segue sender:(id)sender
{
  if ([segue.identifier isEqualToString:@"detailsSegue"])
  {
    SharedNoteDetailsViewController* destViewController = segue.destinationViewController;
    NSIndexPath* indexPath = (NSIndexPath*)sender;
    destViewController.note = self.notes[indexPath.item];
  }
}

@end
