function get2FAMethod() {
  const method = prompt(
    "Choose 2FA method:\n1. None\n2. Authentication app\n3. Phone call\n4. SMS"
  );

  switch (method) {
    case "1":
      return "None";
    case "2":
      return "Authentication app";
    case "3":
      return "Phone call";
    case "4":
      return "SMS";
    default:
      return "Invalid choice";
  }
}

const selectedMethod = get2FAMethod();
console.log("Selected 2FA method:", selectedMethod);
