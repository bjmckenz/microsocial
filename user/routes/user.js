def get_2fa_method():
    print("Choose 2FA method:")
    print("1. None")
    print("2. Authentication app")
    print("3. Phone call")
    print("4. SMS")
    choice = input("Enter your choice (1-4): ")

    if choice == "1":
        return "None"
    elif choice == "2":
        return "Authentication app"
    elif choice == "3":
        return "Phone call"
    elif choice == "4":
        return "SMS"
    else:
        return "Invalid choice"


selected_method = get_2fa_method()
print("Selected 2FA method:", selected_method)

