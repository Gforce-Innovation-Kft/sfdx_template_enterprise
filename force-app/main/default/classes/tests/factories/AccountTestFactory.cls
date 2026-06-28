/**
 * Project test-data wrapper for Account. Keeps Account field defaults in one
 * place — tests call this, never TestDataFactory or `new Account()` directly.
 */
@IsTest
public class AccountTestFactory {
  public static Account createAccount(Map<String, Object> overrides) {
    Map<String, Object> defaults = new Map<String, Object>{
      'Name' => 'Test Account'
    };
    if (overrides != null) {
      defaults.putAll(overrides);
    }
    return (Account) TestDataFactory.createSObject('Account', defaults);
  }

  public static List<Account> createAccounts(
    Integer count,
    Map<String, Object> overrides
  ) {
    Map<String, Object> defaults = new Map<String, Object>{
      'Name' => 'Test Account {!index}'
    };
    if (overrides != null) {
      defaults.putAll(overrides);
    }
    return TestDataFactory.createSObjectList('Account', defaults, count);
  }
}
