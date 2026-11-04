CD = '''public static int CountDigits(string text)
{
    int count = 0;
    for (int i = 0; i < text.Length; i++)
    {
        if (Char.IsDigit(text[i]))
        {
            count++;
        }
    }
    return count;
}'''
ME = '''public static string MakeEmail(string first, string last)
{
    string email = first.Substring(0, 1) + last;
    email = email.ToLower();
    email = email.Replace("'", "");
    email = email.Replace(" ", "");
    return email + "@example.com";
}'''
DT = '''public static int DigitTotal(int number)
{
    string digits = number.ToString();
    int total = 0;
    for (int i = 0; i < digits.Length; i++)
    {
        total = total + int.Parse(digits[i].ToString());
    }
    return total;
}'''
FR = '''public static string FakeReason(string id)
{
    if (id.Length != 7)
    {
        return "It must be 7 characters long.";
    }
    if (!Char.IsUpper(id[0]) || !Char.IsUpper(id[1]))
    {
        return "The first two characters must be capital letters.";
    }
    if (id[2] != '-')
    {
        return "The third character must be a hyphen.";
    }
    int number;
    bool isNumber = int.TryParse(id.Substring(3), out number);
    if (!isNumber)
    {
        return "The last four characters must be a whole number.";
    }
    if (number < 1000 || number > 4999)
    {
        return "The number must be from 1000 to 4999.";
    }
    return "";
}'''
S = lambda k, at, brief, line, *wrong: {'k': k, 'at': at, 'brief': brief, 'line': line, 'wrong': [{'t': t, 'why': y} for t, y in wrong]}
PRACTICALS = [
 {'id': 'p1', 'part': 'A', 'name': 'The Name Reader', 'bookIn': ['Aoife', ''], 'prompts': ['Type your name: ', 'Press Enter to close this window.\n'],
  'building': 'A program that reads a name, says how long it is, prints each letter with its position, counts the capitals and the digits, and says whether every character is a letter.',
  'methods': '''public static void ShowLetters(string word)
{
    {{1}}
    {
        {{2}}
    }
}

public static int CountCapitals(string text)
{
    int count = 0;
    for (int i = 0; i < text.Length; i++)
    {
        {{3}}
        {
            count++;
        }
    }
    {{4}}
}

''' + CD + '''

public static bool AllLetters(string text)
{
    if (text.Length == 0)
    {
        return false;
    }
    for (int i = 0; i < text.Length; i++)
    {
        {{5}}
        {
            return false;
        }
    }
    return true;
}''',
  'main': '''Console.Write("Type your name: ");
string name = Console.ReadLine();
{{6}}
ShowLetters(name);
Console.WriteLine($"Capital letters: {CountCapitals(name)}");
Console.WriteLine($"Digits: {CountDigits(name)}");
if (AllLetters(name))
{
    Console.WriteLine("Every character is a letter.");
}
else
{
    Console.WriteLine("Not every character is a letter.");
}
''' + CLOSE,
  'steps': [
   S(1, 'ShowLetters · the loop', 'Loop over every position in word, from the first box to the last.', 'for (int i = 0; i < word.Length; i++)',
     ('for (int i = 0; i <= word.Length; i++)', 'With `<=` the loop reaches a box that is not there, and the program crashes.'),
     ('for (int i = 1; i < word.Length; i++)', 'Boxes start at 0, so starting at 1 misses the first letter.'),
     ('for (int i = 0; i < word.Length(); i++)', 'Length is a property, so it has no brackets.')),
   S(2, 'ShowLetters · the print', 'Print the word Position, the number, a colon and the letter in that box.', 'Console.WriteLine($"Position {i}: {word[i]}");',
     ('Console.WriteLine($"Position {i}: {word}");', 'This prints the whole word every time. `word[i]` is the letter in box i.'),
     ('Console.WriteLine($"Position {i}: {word[0]}");', 'This prints the first letter every time, because the box number never changes.'),
     ('Console.WriteLine("Position {i}: {word[i]}");', 'Without the `$` the braces are printed as they are.')),
   S(3, 'CountCapitals · the test', 'Test whether the character in box i is a capital letter.', 'if (Char.IsUpper(text[i]))',
     ('if (Char.IsLetter(text[i]))', 'This counts every letter, not only the capitals.'),
     ('if (Char.IsUpper(text))', 'Char.IsUpper tests one character, and text is a whole string.'),
     ('if (Char.IsDigit(text[i]))', 'This counts digits, so a name gives 0 capitals.')),
   S(4, 'CountCapitals · the last line', 'Hand the count back to whoever called the method.', 'return count;',
     ('return text.Length;', 'This hands back how long the text is, whatever the count was.'),
     ('Console.WriteLine(count);', 'The method promises an int, so it must return one. Printing is not returning.'),
     ('return;', 'A method that promises an int must return a value.')),
   S(5, 'AllLetters · the test', 'Refuse the moment a character is not a letter.', 'if (!Char.IsLetter(text[i]))',
     ('if (Char.IsLetter(text[i]))', 'This returns false at the first letter, so a real name fails.'),
     ('if (!Char.IsLetter(text))', 'Char.IsLetter tests one character, and text is a whole string.'),
     ('if (!Char.IsDigit(text[i]))', 'This refuses anything that is not a digit, so a real name fails.')),
   S(6, 'Main · the length line', 'Print the name, the word has, its length and the word characters.', 'Console.WriteLine($"{name} has {name.Length} characters.");',
     ('Console.WriteLine($"{name} has {name.Length()} characters.");', 'Length is a property, so it has no brackets.'),
     ('Console.WriteLine($"{name} has {name.Length - 1} characters.");', 'Length is already the count. Length - 1 is the last box number.'),
     ('Console.WriteLine("{name} has {name.Length} characters.");', 'Without the `$` the braces are printed as they are.')),
  ],
  'closing': ['The last box is always Length - 1, so the loop runs while i is less than Length.', 'Char.IsUpper, Char.IsDigit and Char.IsLetter each test one character, so each one needs a box number.'],
  'own': {'title': 'On your own: CountDigits', 'problem': ['Write the method `CountDigits`. It takes a string called `text` and returns how many of its characters are digits.', 'Use a counter that starts at 0, a for loop over every character, and `Char.IsDigit`.'],
    'model': CD.split('\n'), 'points': [{'t': 'The header: `public static int CountDigits(string text)`', 'find': r'int\s+CountDigits\s*\(\s*string\s+text\s*\)'}, {'t': 'A counter that starts at 0'}, {'t': 'A for loop that stops before `text.Length`', 'find': r'i\s*<\s*text\.Length'}, {'t': '`Char.IsDigit(text[i])` tests one character', 'find': r'Char\.IsDigit\s*\(\s*text\s*\[\s*i\s*\]\s*\)'}, {'t': 'The counter goes up inside the test'}, {'t': '`return count;` comes after the loop', 'find': r'return\s+count'}],
    'notes': ['It has the same shape as CountCapitals: only the test changes.']},
  'slips': {'intro': 'Six people wrote CountDigits. Main runs one line: `Console.WriteLine(CountDigits("Room 12"));`', 'note': 'Main runs: Console.WriteLine(CountDigits("Room 12"));', 'main': 'Console.WriteLine(CountDigits("Room 12"));',
    'versions': [(CD, '"Room 12" has two digits, and this version counts them.'),
      (CD.replace('i < text', 'i <= text'), 'With `<=` the loop reaches a box that is not there.'),
      (CD.replace('IsDigit', 'IsLetter'), 'This counts the letters: R, o, o and m.'),
      (CD.replace('count++;', 'count = 1;'), 'The count is set to 1 again and again, so it never passes 1.'),
      (CD.replace('int count = 0;', 'int count;'), 'A local variable must be given a value before it is added to.'),
      (CD.replace('text[i]', 'text'), 'Char.IsDigit tests one character, and text is a whole string.')]},
 },
 {'id': 'p2', 'part': 'B', 'name': 'String Surgery', 'bookIn': ["Aoife O'Neill", ''], 'prompts': ['Type your full name: ', 'Press Enter to close this window.\n'],
  'building': 'A program that takes a full name apart: first name, last name, initials and a school email address.',
  'methods': '''public static string FirstWord(string text)
{
    {{1}}
    if (space == -1)
    {
        return text;
    }
    {{2}}
}

public static string LastWord(string text)
{
    int space = text.IndexOf(" ");
    if (space == -1)
    {
        return text;
    }
    {{3}}
}

public static string Initials(string fullName)
{
    {{4}}
}

''' + ME,
  'main': '''Console.Write("Type your full name: ");
string name = Console.ReadLine();
Console.WriteLine($"First name: {FirstWord(name)}");
Console.WriteLine($"Last name: {LastWord(name)}");
Console.WriteLine($"Initials: {Initials(name)}");
Console.WriteLine($"Email: {MakeEmail(FirstWord(name), LastWord(name))}");
Console.WriteLine($"Starts with O': {LastWord(name).StartsWith("O'")}");
Console.WriteLine($"Has a hyphen: {name.Contains("-")}");
{{5}}
Console.WriteLine(name);
''' + CLOSE,
  'steps': [
   S(1, 'FirstWord · find the space', 'Store the position of the first space in a new int called space.', 'int space = text.IndexOf(" ");',
     ('string space = text.IndexOf(" ");', 'IndexOf gives back a number, so it cannot go in a string.'),
     ('int space = text.Length;', 'That is how long the text is, so the whole name comes back as the first word.'),
     ('int space = text.Substring(" ");', 'Substring takes numbers and gives text. IndexOf is the method that finds a position.')),
   S(2, 'FirstWord · cut it out', 'Hand back everything before the space.', 'return text.Substring(0, space);',
     ('return text.Substring(0, space - 1);', 'The second number is how many, not where to stop. The space is at box 5, and 5 characters are wanted.'),
     ('return text.Substring(1, space);', 'Starting at box 1 loses the first letter.'),
     ('return text.Substring(space);', 'With one number, Substring runs to the end, so this gives the last name instead.')),
   S(3, 'LastWord · cut it out', 'Hand back everything after the space.', 'return text.Substring(space + 1);',
     ('return text.Substring(space);', 'Starting at the space keeps the space on the front.'),
     ('return text.Substring(space + 1, text.Length);', 'The second number is how many, and there are not that many left, so it crashes.'),
     ('return text.Substring(space - 1);', 'Starting before the space keeps the end of the first name.')),
   S(4, 'Initials · the one line', 'Hand back the first letter of each word, joined together.', 'return FirstWord(fullName).Substring(0, 1) + LastWord(fullName).Substring(0, 1);',
     ('return fullName[0] + LastWord(fullName)[0];', 'Two chars added together make a number, not a string, so it will not build.'),
     ('return FirstWord(fullName).Substring(0) + LastWord(fullName).Substring(0);', 'Substring(0) is the whole word, so this joins both names.'),
     ('return FirstWord(fullName).Substring(1, 1) + LastWord(fullName).Substring(1, 1);', 'Box 1 is the second letter. The first letter is in box 0.')),
   S(5, 'Main · make it capitals', 'Make name all capitals and keep the result.', 'name = name.ToUpper();',
     ('name.ToUpper();', 'A string cannot change. ToUpper makes a new string, and nothing stores it.'),
     ('name = ToUpper(name);', 'ToUpper belongs to the string, so it is written name.ToUpper().'),
     ('name = name.ToUpper;', 'A method call needs its brackets.')),
  ],
  'closing': ['Substring takes where to start and how many to take.', 'A string never changes. Every string method makes a new one, so store the result.'],
  'own': {'title': 'On your own: MakeEmail', 'problem': ['Write the method `MakeEmail`. It takes `first` and `last`, and returns the first letter of first joined to last, in lower case, with any apostrophe and any space taken out, then `@example.com` on the end.', 'For Aoife and O\'Neill it returns `aoneill@example.com`.'],
    'model': ME.split('\n'), 'points': [{'t': 'The header: `public static string MakeEmail(string first, string last)`', 'find': r'string\s+MakeEmail\s*\('}, {'t': 'The first letter joined to last', 'find': r'first\.Substring\s*\(\s*0\s*,\s*1\s*\)\s*\+\s*last'}, {'t': 'ToLower, with the result stored', 'find': r'email\s*=\s*email\.ToLower'}, {'t': 'Replace takes out the apostrophe, with the result stored'}, {'t': 'Replace takes out any space, with the result stored'}, {'t': '`@example.com` is joined on at the end', 'find': r'@example\.com'}],
    'notes': ['Every line that changes the string stores the result back in email.']},
  'slips': {'intro': "Six people wrote MakeEmail. Main runs one line: `Console.WriteLine(MakeEmail(\"Aoife\", \"O'Neill\"));`", 'note': 'Main runs: Console.WriteLine(MakeEmail("Aoife", "O\'Neill"));', 'main': 'Console.WriteLine(MakeEmail("Aoife", "O\'Neill"));',
    'versions': [(ME, 'Every step stores its result, so the address is right.'),
      (ME.replace('email = email.ToLower();', 'email.ToLower();'), 'ToLower makes a new string, and nothing stores it.'),
      (ME.replace('''email = email.Replace("'", "");''', '''email.Replace("'", "");'''), 'Replace makes a new string, and nothing stores it, so the apostrophe stays.'),
      (ME.replace('first.Substring(0, 1) + last', 'first + last'), 'This joins the whole first name, not its first letter.'),
      (ME.replace('return email + "@example.com";', 'return email;'), 'Nothing joins the end of the address on.'),
      (ME.replace('first.Substring(0, 1)', 'first.Substring(0, 9)'), 'The second number is how many, and Aoife has only five letters, so it crashes.')]},
 },
 {'id': 'p3', 'part': 'C', 'name': 'Username Maker', 'seed': True, 'bookIn': ['Tom', 'McKee', 'six', '9', '3', ''], 'prompts': ['First name: ', 'Last name: ', 'How many usernames (1 to 5)? ', 'Press Enter to close this window.\n'],
  'building': 'A program that reads two names and a checked number, then makes that many usernames with a random three-digit number on each.',
  'methods': '''public static int ReadWholeNumber(string prompt, int min, int max)
{
    int number = 0;
    bool ok;
    do
    {
        Console.Write(prompt);
        string text = Console.ReadLine();
        {{1}}
        {{2}}
        {
            Console.WriteLine($"Error: enter a whole number from {min} to {max}.");
            ok = false;
        }
    } while (!ok);
    return number;
}

public static string MakeUsername(string first, string last, int number)
{
    {{3}}
}

''' + DT,
  'main': '''Console.Write("First name: ");
string first = Console.ReadLine();
Console.Write("Last name: ");
string last = Console.ReadLine();
{{4}}
Random random = new Random();
{{5}}
{
    {{6}}
    string username = MakeUsername(first, last, number);
    Console.WriteLine($"{i}: {username} (digit total {DigitTotal(number)})");
}
''' + CLOSE,
  'steps': [
   S(1, 'ReadWholeNumber · read safely', 'Try to turn text into number, and store whether it worked in ok.', 'ok = int.TryParse(text, out number);',
     ('ok = int.TryParse(text, number);', 'TryParse needs the word `out` before the variable it fills.'),
     ('ok = int.Parse(text);', 'int.Parse hands back a number, not true or false, so it cannot be stored in `ok`.'),
     ('number = int.Parse(text);', 'ok never gets a value on this line, so the test below it will not build.')),
   S(2, 'ReadWholeNumber · the test', 'Refuse it if it did not parse, or if it is below min, or if it is above max.', 'if (!ok || number < min || number > max)',
     ('if (!ok || number < min && number > max)', 'No number is below min and above max at once, so 9 gets through.'),
     ('if (!ok)', 'This only tests that it is a number, so 9 gets through.')),
   S(3, 'MakeUsername · the one line', 'Hand back the first letter of first, then last, then the number as text.', 'return first.Substring(0, 1) + last + number.ToString();',
     ('return first + last + number.ToString();', 'This joins the whole first name, not its first letter.'),
     ('return first.Substring(1, 1) + last + number.ToString();', 'Box 1 is the second letter. The first letter is in box 0.'),
     ('return first.Substring(0, 1) + last;', 'The number never gets joined on.')),
   S(4, 'Main · how many', 'Call ReadWholeNumber with the prompt, 1 and 5, and store the answer.', 'int count = ReadWholeNumber("How many usernames (1 to 5)? ", 1, 5);',
     ('string count = ReadWholeNumber("How many usernames (1 to 5)? ", 1, 5);', 'ReadWholeNumber returns an int, so it cannot go in a string.'),
     ('int count = ReadWholeNumber("How many usernames (1 to 5)? ");', 'The method needs all three values: the prompt, the lowest and the highest.'),
     ('int count = Console.ReadLine();', 'ReadLine gives text, and nothing checks it.')),
   S(5, 'Main · the loop', 'Count from 1 up to and including count.', 'for (int i = 1; i <= count; i++)',
     ('for (int i = 0; i <= count; i++)', 'From 0 up to and including count is one time too many.'),
     ('for (int i = 1; i < count; i++)', 'From 1 and stopping before count is one time too few.')),
   S(6, 'Main · the random number', 'Store a random number from 100 to 999 in a new int called number.', 'int number = random.Next(100, 1000);',
     ('int number = random.Next(100, 999);', 'The top number is never given, so `Next(100, 999)` never gives 999.'),
     ('int number = random.Next(999);', 'With one number it starts at 0, so a username could end in a one-digit number.'),
     ('int number = Random.Next(100, 1000);', 'Next belongs to the variable random, spelled with a small r.')),
  ],
  'closing': ['The top number of random.Next is never given, so 100 to 999 is Next(100, 1000).', 'The numbers are random, so each run prints different usernames. This run is one real example.'],
  'own': {'title': 'On your own: DigitTotal', 'problem': ['Write the method `DigitTotal`. It takes an int called `number` and returns the total of its digits.', 'Turn number into a string, go through it with a for loop, and add each digit to a total. For 482 it returns 14.'],
    'model': DT.split('\n'), 'points': [{'t': 'The header: `public static int DigitTotal(int number)`', 'find': r'int\s+DigitTotal\s*\('}, {'t': 'The number turned into a string with `ToString()`', 'find': r'number\.ToString\s*\(\s*\)'}, {'t': 'A total that starts at 0'}, {'t': 'A for loop over every digit'}, {'t': 'Each digit turned back into an int with `int.Parse(digits[i].ToString())`', 'find': r'int\.Parse\s*\(\s*digits\s*\[\s*i\s*\]\.ToString'}, {'t': '`return total;` comes after the loop', 'find': r'return\s+total'}],
    'notes': ['A char is not a number you can add, so each digit goes through ToString and int.Parse first.']},
  'slips': {'intro': 'Six people wrote DigitTotal. Main runs one line: `Console.WriteLine(DigitTotal(482));`', 'note': 'Main runs: Console.WriteLine(DigitTotal(482));', 'main': 'Console.WriteLine(DigitTotal(482));',
    'versions': [(DT, '4 + 8 + 2 is 14.'),
      (DT.replace('total + int.Parse(digits[i].ToString())', 'total + digits[i]'), 'A char added to an int uses its character code, not its digit. The codes for 4, 8 and 2 are 52, 56 and 50.'),
      (DT.replace('digits[i].ToString()', 'digits[i]'), 'int.Parse takes a string, and digits[i] is a char.'),
      (DT.replace('i < digits', 'i <= digits'), 'With `<=` the loop reaches a box that is not there.'),
      (DT.replace('total = total + ', 'total = '), 'Each digit replaces the total, so only the last digit is left.'),
      (DT.replace('int total = 0;', 'int total;'), 'A local variable must be given a value before it is added to.')]},
 },
 {'id': 'p4', 'part': 'D', 'name': 'The Fake ID Lab', 'bookIn': ['AO-1234', 'ZZ-4999', 'AO-12345', 'aO-1234', 'AO+1234', 'AO-12X4', 'AO-5000', 'stop', ''], 'prompts': ['ID to check (or stop): ', 'Press Enter to close this window.\n'],
  'building': 'A program that checks IDs until the user types stop. An ID is two capital letters, a hyphen, then a whole number from 1000 to 4999. Each fake ID is told why it failed.',
  'methods': '''public static bool ValidId(string id)
{
    {{1}}
    {
        return false;
    }
    if (!Char.IsUpper(id[0]) || !Char.IsUpper(id[1]))
    {
        return false;
    }
    {{2}}
    {
        return false;
    }
    int number;
    {{3}}
    if (!isNumber)
    {
        return false;
    }
    {{4}}
    {
        return false;
    }
    return true;
}

''' + FR,
  'main': '''int valid = 0;
int fake = 0;
Console.Write("ID to check (or stop): ");
string id = Console.ReadLine();
{{5}}
{
    if (ValidId(id))
    {
        Console.WriteLine("VALID");
        valid = valid + 1;
    }
    else
    {
        Console.WriteLine($"FAKE: {FakeReason(id)}");
        fake = fake + 1;
    }
    Console.Write("ID to check (or stop): ");
    {{6}}
}
Console.WriteLine($"Checked {valid + fake}: {valid} valid, {fake} fake.");
''' + CLOSE,
  'steps': [
   S(1, 'ValidId · the length', 'Refuse it if it is not seven characters long.', 'if (id.Length != 7)',
     ('if (id.Length != 8)', 'The ID has seven characters: two letters, a hyphen and four digits. This refuses every right one.'),
     ('if (id.Length == 7)', 'This refuses the right length, so every real ID fails.'),
     ('if (id.Length() != 7)', 'Length is a property, so it has no brackets.')),
   S(2, 'ValidId · the hyphen', 'Refuse it if the third character is not a hyphen.', "if (id[2] != '-')",
     ("if (id[2] == '-')", 'This refuses the IDs that do have the hyphen.'),
     ("if (id[3] != '-')", 'The third character is in box 2. Boxes start at 0.'),
     ('if (id[2] != "-")', 'id[2] is a char, and double quotes make a string, so the two cannot be compared.')),
   S(3, 'ValidId · the number', 'Try to turn the last four characters into number, and store whether it worked.', 'bool isNumber = int.TryParse(id.Substring(3), out number);',
     ('bool isNumber = int.TryParse(id.Substring(3, 3), out number);', 'The second number is how many, so this reads three digits, and no three-digit number reaches 1000.'),
     ('bool isNumber = int.Parse(id.Substring(3));', 'int.Parse gives a number, not true or false.'),
     ('bool isNumber = int.TryParse(id.Substring(3), number);', 'TryParse needs the word `out` before the variable it fills.')),
   S(4, 'ValidId · the range', 'Refuse it if the number is below 1000 or above 4999.', 'if (number < 1000 || number > 4999)',
     ('if (number < 1000 && number > 4999)', 'No number is below 1000 and above 4999 at once, so this never refuses.'),
     ('if (number <= 1000 || number >= 4999)', '1000 and 4999 are allowed, so this refuses numbers it should accept.'),
     ('if (number > 1000 || number < 4999)', 'Every number passes one of these, so every ID is refused.')),
   S(5, 'Main · the loop', 'Keep going while id is not the word stop.', 'while (id != "stop")',
     ('while (id == "stop")', 'The first ID is not stop, so the loop never runs.'),
     ('while (id != stop)', 'Without the quotes, stop is a variable that does not exist.'),
     ('if (id != "stop")', 'An if runs once, so only one ID gets checked.')),
   S(6, 'Main · the next ID', 'Read the next ID into the same variable.', 'id = Console.ReadLine();',
     ('string id = Console.ReadLine();', 'id already exists, so writing string again declares it twice.'),
     ('id = Console.Read();', 'Console.Read gives back a number for one character, not a line of text.'),
     ('id == Console.ReadLine();', '`==` compares, and `=` stores.')),
  ],
  'closing': ['Length first, each position next, the number with TryParse and its range, and return true only at the very end.', 'A loop that stops on a word reads once before it starts, and reads again as its last line.'],
  'own': {'title': 'On your own: FakeReason', 'problem': ['Write the method `FakeReason`. It takes an ID and returns the reason for the first rule it breaks, in this order:', '`It must be 7 characters long.` · `The first two characters must be capital letters.` · `The third character must be a hyphen.` · `The last four characters must be a whole number.` · `The number must be from 1000 to 4999.`', 'If it breaks no rule, it returns an empty string.'],
    'model': FR.split('\n'), 'points': [{'t': 'The header: `public static string FakeReason(string id)`', 'find': r'string\s+FakeReason\s*\('}, {'t': 'The length is tested first', 'find': r'id\.Length\s*!=\s*7'}, {'t': 'The two capital letters are tested', 'find': r'IsUpper'}, {'t': 'The hyphen in box 2 is tested'}, {'t': '`int.TryParse` tests the last four characters', 'find': r'TryParse'}, {'t': 'The range 1000 to 4999 is tested'}, {'t': 'An empty string comes back at the end', 'find': r'return\s*""'}],
    'notes': ['It has the same tests as ValidId in the same order, but each one hands back its reason.']},
  'slips': {'intro': 'Six people wrote FakeReason. Main runs one line: `Console.WriteLine(FakeReason("AO-12X4"));`', 'note': 'Main runs: Console.WriteLine(FakeReason("AO-12X4"));', 'main': 'Console.WriteLine(FakeReason("AO-12X4"));',
    'versions': [(FR, '"12X4" is not a whole number, and every rule before that one passes.'),
      (FR.replace('''int number;
    bool isNumber = int.TryParse(id.Substring(3), out number);
    if (!isNumber)
    {
        return "The last four characters must be a whole number.";
    }''', 'int number = int.Parse(id.Substring(3));'), 'int.Parse crashes on 12X4. A validator needs TryParse.'),
      (FR.replace("id[2] != '-'", "id[2] == '-'"), 'The test is the wrong way round, so a real hyphen is refused.'),
      (FR.replace('id.Length != 7', 'id.Length == 7'), 'The test is the wrong way round, so the right length is refused.'),
      (FR.replace('if (!isNumber)', 'if (isNumber)'), 'The test is the wrong way round. TryParse fails, leaves number at 0, and the range test catches it.'),
      (FR.replace('    return "";\n', ''), 'Every path must return a string, and the end of the method does not.')]},
 },
]
