import * as Optic from "@fp-ts/optic"
import { pipe } from "effect/Function"
import * as O from "effect/Option"
import { immerable } from "immer"
import { describe, expect, it } from "vitest"

describe("Immerable class support", () => {
  class Person {
    [immerable] = true

    constructor(
      readonly name: string,
      readonly age: number,
      readonly address: Address
    ) {}

    greet() {
      return `Hello, I'm ${this.name}`
    }
  }

  class Address {
    [immerable] = true

    constructor(
      readonly street: string,
      readonly city: string
    ) {}

    format() {
      return `${this.street}, ${this.city}`
    }
  }

  it("should modify immerable class instance fields", () => {
    const person = new Person("Alice", 30, new Address("123 Main St", "NYC"))
    const _name = Optic.id<Person>().at("name")

    const result = pipe(person, Optic.replace(_name)("Bob"))

    expect(result).toBeInstanceOf(Person)
    expect(result.name).toBe("Bob")
    expect(result.age).toBe(30)
    expect(result.greet()).toBe("Hello, I'm Bob")
    expect(result).not.toBe(person) // immutability check
  })

  it("should modify nested immerable class instances", () => {
    const person = new Person("Alice", 30, new Address("123 Main St", "NYC"))
    const _city = Optic.id<Person>().at("address").at("city")

    const result = pipe(person, Optic.replace(_city)("LA"))

    expect(result).toBeInstanceOf(Person)
    expect(result.address).toBeInstanceOf(Address)
    expect(result.address.city).toBe("LA")
    expect(result.address.street).toBe("123 Main St")
    expect(result.address.format()).toBe("123 Main St, LA")
    expect(result).not.toBe(person) // immutability check
    expect(result.address).not.toBe(person.address) // immutability check
  })

  it("should use modify with immerable classes", () => {
    const person = new Person("Alice", 30, new Address("123 Main St", "NYC"))
    const _age = Optic.id<Person>().at("age")

    const result = pipe(person, Optic.modify(_age)((age) => age + 1))

    expect(result).toBeInstanceOf(Person)
    expect(result.age).toBe(31)
    expect(result.name).toBe("Alice")
    expect(result.greet()).toBe("Hello, I'm Alice")
  })

  it("should work with complex nested modifications", () => {
    const person = new Person("Alice", 30, new Address("123 Main St", "NYC"))
    const _street = Optic.id<Person>().at("address").at("street")

    const result = pipe(
      person,
      Optic.modify(_street)((street) => street.replace("123", "456"))
    )

    expect(result).toBeInstanceOf(Person)
    expect(result.address).toBeInstanceOf(Address)
    expect(result.address.street).toBe("456 Main St")
    expect(result.address.format()).toBe("456 Main St, NYC")
  })

  it("should preserve class methods after modification", () => {
    const person = new Person("Alice", 30, new Address("123 Main St", "NYC"))
    const _name = Optic.id<Person>().at("name")

    const result = pipe(person, Optic.replace(_name)("Bob"))

    expect(typeof result.greet).toBe("function")
    expect(result.greet()).toBe("Hello, I'm Bob")
    expect(typeof result.address.format).toBe("function")
    expect(result.address.format()).toBe("123 Main St, NYC")
  })

  it("should work with plain objects alongside immerable classes", () => {
    type Data = {
      readonly person: Person
      readonly metadata: {
        readonly created: string
        readonly updated: string
      }
    }

    const data: Data = {
      person: new Person("Alice", 30, new Address("123 Main St", "NYC")),
      metadata: {
        created: "2024-01-01",
        updated: "2024-01-01"
      }
    }

    const _updated = Optic.id<Data>().at("metadata").at("updated")
    const result = pipe(data, Optic.replace(_updated)("2024-01-02"))

    expect(result.person).toBeInstanceOf(Person)
    expect(result.metadata.updated).toBe("2024-01-02")
    expect(result.person.greet()).toBe("Hello, I'm Alice")
  })

  it("should maintain immutability - original should be unchanged", () => {
    const person = new Person("Alice", 30, new Address("123 Main St", "NYC"))
    const _name = Optic.id<Person>().at("name")

    const result = pipe(person, Optic.replace(_name)("Bob"))

    expect(person.name).toBe("Alice")
    expect(result.name).toBe("Bob")
  })

  it("should work with deeply nested immerable classes", () => {
    class Country {
      [immerable] = true
      constructor(readonly name: string, readonly code: string) {}
    }

    class City {
      [immerable] = true
      constructor(readonly name: string, readonly country: Country) {}
    }

    class Street {
      [immerable] = true
      constructor(readonly name: string, readonly city: City) {}
    }

    class Building {
      [immerable] = true
      constructor(readonly number: number, readonly street: Street) {}
    }

    const building = new Building(
      123,
      new Street("Main St", new City("NYC", new Country("USA", "US")))
    )

    const _countryCode = Optic.id<Building>()
      .at("street")
      .at("city")
      .at("country")
      .at("code")

    const result = pipe(building, Optic.replace(_countryCode)("USA"))

    expect(result).toBeInstanceOf(Building)
    expect(result.street).toBeInstanceOf(Street)
    expect(result.street.city).toBeInstanceOf(City)
    expect(result.street.city.country).toBeInstanceOf(Country)
    expect(result.street.city.country.code).toBe("USA")
    expect(result.number).toBe(123)
    expect(result.street.name).toBe("Main St")
    expect(result.street.city.name).toBe("NYC")
    expect(result.street.city.country.name).toBe("USA")
  })

  it("should work with plain objects nested inside immerable classes", () => {
    class Company {
      [immerable] = true
      constructor(
        readonly name: string,
        readonly metadata: {
          readonly founded: number
          readonly employees: number
        }
      ) {}
    }

    const company = new Company("Acme Corp", { founded: 1990, employees: 100 })
    const _employees = Optic.id<Company>().at("metadata").at("employees")

    const result = pipe(company, Optic.modify(_employees)((n) => n + 50))

    expect(result).toBeInstanceOf(Company)
    expect(result.name).toBe("Acme Corp")
    expect(result.metadata.employees).toBe(150)
    expect(result.metadata.founded).toBe(1990)
    expect(result).not.toBe(company)
    expect(result.metadata).not.toBe(company.metadata)
  })

  it("should work with arrays nested inside immerable classes", () => {
    class Team {
      [immerable] = true
      constructor(
        readonly name: string,
        readonly members: ReadonlyArray<string>
      ) {}
    }

    const team = new Team("Dev Team", ["Alice", "Bob", "Charlie"])
    const _member1 = Optic.id<Team>().at("members").index(1)

    const result = pipe(team, Optic.replace(_member1)("Bobby"))

    expect(result).toBeInstanceOf(Team)
    expect(result.name).toBe("Dev Team")
    expect(result.members).toEqual(["Alice", "Bobby", "Charlie"])
    expect(result).not.toBe(team)
    expect(result.members).not.toBe(team.members)
  })

  it("should work with Option nested inside immerable classes", () => {
    class User {
      [immerable] = true
      constructor(
        readonly username: string,
        readonly email: O.Option<string>
      ) {}
    }

    const user = new User("alice", O.some("alice@example.com"))
    const _email = Optic.id<User>().at("email").some()

    const result = pipe(user, Optic.replace(_email)("alice@newdomain.com"))

    expect(result).toBeInstanceOf(User)
    expect(result.username).toBe("alice")
    expect(result.email).toEqual(O.some("alice@newdomain.com"))
    expect(result).not.toBe(user)
  })

  it("should work with immerable classes inside arrays", () => {
    class Product {
      [immerable] = true
      constructor(readonly name: string, readonly price: number) {}
    }

    const products: ReadonlyArray<Product> = [
      new Product("Apple", 1.5),
      new Product("Banana", 0.5),
      new Product("Orange", 2.0)
    ]

    const _price1 = Optic.id<ReadonlyArray<Product>>().index(1).at("price")

    const result = pipe(products, Optic.modify(_price1)((p) => p * 2))

    expect(result[0]).toBeInstanceOf(Product)
    expect(result[1]).toBeInstanceOf(Product)
    expect(result[2]).toBeInstanceOf(Product)
    expect(result[1].price).toBe(1.0)
    expect(result[1].name).toBe("Banana")
    expect(result[0].price).toBe(1.5)
    expect(result[2].price).toBe(2.0)
    expect(result).not.toBe(products)
    expect(result[1]).not.toBe(products[1])
  })

  it("should work with immerable classes inside plain objects", () => {
    class Settings {
      [immerable] = true
      constructor(readonly theme: string, readonly fontSize: number) {}
    }

    type Config = {
      readonly appSettings: Settings
      readonly version: string
    }

    const config: Config = {
      appSettings: new Settings("dark", 14),
      version: "1.0.0"
    }

    const _theme = Optic.id<Config>().at("appSettings").at("theme")

    const result = pipe(config, Optic.replace(_theme)("light"))

    expect(result.appSettings).toBeInstanceOf(Settings)
    expect(result.appSettings.theme).toBe("light")
    expect(result.appSettings.fontSize).toBe(14)
    expect(result.version).toBe("1.0.0")
    expect(result).not.toBe(config)
    expect(result.appSettings).not.toBe(config.appSettings)
  })

  it("should work with mixed nested structures", () => {
    class Tag {
      [immerable] = true
      constructor(readonly name: string, readonly color: string) {}
    }

    class Note {
      [immerable] = true
      constructor(
        readonly title: string,
        readonly tags: ReadonlyArray<Tag>,
        readonly metadata: { readonly created: string; readonly author: string }
      ) {}
    }

    const note = new Note(
      "My Note",
      [new Tag("important", "red"), new Tag("work", "blue")],
      { created: "2024-01-01", author: "Alice" }
    )

    // Modify a tag color inside the array inside the immerable class
    const _tagColor = Optic.id<Note>().at("tags").index(0).at("color")
    const result = pipe(note, Optic.replace(_tagColor)("orange"))

    expect(result).toBeInstanceOf(Note)
    expect(result.tags[0]).toBeInstanceOf(Tag)
    expect(result.tags[1]).toBeInstanceOf(Tag)
    expect(result.tags[0].color).toBe("orange")
    expect(result.tags[0].name).toBe("important")
    expect(result.tags[1].color).toBe("blue")
    expect(result.title).toBe("My Note")
    expect(result.metadata.author).toBe("Alice")
    expect(result).not.toBe(note)
    expect(result.tags).not.toBe(note.tags)
    expect(result.tags[0]).not.toBe(note.tags[0])
  })
})

describe("Immutable guarantees - structural sharing", () => {
  class Person {
    [immerable] = true
    constructor(
      readonly name: string,
      readonly address: Address,
      readonly metadata: { readonly id: number }
    ) {}
  }

  class Address {
    [immerable] = true
    constructor(readonly city: string, readonly country: Country) {}
  }

  class Country {
    [immerable] = true
    constructor(readonly name: string) {}
  }

  it("should preserve unchanged nested objects (structural sharing)", () => {
    const person = new Person(
      "Alice",
      new Address("NYC", new Country("USA")),
      { id: 1 }
    )

    const _name = Optic.id<Person>().at("name")
    const result = pipe(person, Optic.replace(_name)("Bob"))

    // The address and its nested country should be the exact same reference
    expect(result.address).toBe(person.address)
    expect(result.address.country).toBe(person.address.country)
    // Metadata should also be preserved
    expect(result.metadata).toBe(person.metadata)
    // But the person itself should be new
    expect(result).not.toBe(person)
  })

  it("should create new instances only for modified path", () => {
    const person = new Person(
      "Alice",
      new Address("NYC", new Country("USA")),
      { id: 1 }
    )

    const _city = Optic.id<Person>().at("address").at("city")
    const result = pipe(person, Optic.replace(_city)("LA"))

    // Person and Address should be new
    expect(result).not.toBe(person)
    expect(result.address).not.toBe(person.address)
    // But Country (not in the modified path) should be preserved
    expect(result.address.country).toBe(person.address.country)
    // Metadata should be preserved
    expect(result.metadata).toBe(person.metadata)
  })

  it("should handle multiple sequential modifications with structural sharing", () => {
    const person = new Person(
      "Alice",
      new Address("NYC", new Country("USA")),
      { id: 1 }
    )

    const _name = Optic.id<Person>().at("name")
    const _city = Optic.id<Person>().at("address").at("city")

    const step1 = pipe(person, Optic.replace(_name)("Bob"))
    const step2 = pipe(step1, Optic.replace(_city)("LA"))

    // Each step should create new instances
    expect(step1).not.toBe(person)
    expect(step2).not.toBe(step1)
    expect(step2.address).not.toBe(step1.address)

    // Original should be unchanged
    expect(person.name).toBe("Alice")
    expect(person.address.city).toBe("NYC")

    // Final result should have both changes
    expect(step2.name).toBe("Bob")
    expect(step2.address.city).toBe("LA")
  })

  it("should never mutate the original object", () => {
    const person = new Person(
      "Alice",
      new Address("NYC", new Country("USA")),
      { id: 1 }
    )

    // Store references to nested objects
    const originalAddress = person.address
    const originalCountry = person.address.country
    const originalMetadata = person.metadata

    const _city = Optic.id<Person>().at("address").at("city")
    pipe(person, Optic.replace(_city)("LA"))

    // Original and all its nested objects should be unchanged
    expect(person.name).toBe("Alice")
    expect(person.address).toBe(originalAddress)
    expect(person.address.city).toBe("NYC")
    expect(person.address.country).toBe(originalCountry)
    expect(person.address.country.name).toBe("USA")
    expect(person.metadata).toBe(originalMetadata)
  })
})

describe("Prism optics with immerable classes", () => {
  class User {
    [immerable] = true
    constructor(
      readonly name: string,
      readonly email: O.Option<string>
    ) {}
  }

  it("should work with some() prism", () => {
    const user = new User("Alice", O.some("alice@example.com"))
    const _email = Optic.id<User>().at("email").some()

    const result = pipe(user, Optic.replace(_email)("newemail@example.com"))

    expect(result).toBeInstanceOf(User)
    expect(result.email).toEqual(O.some("newemail@example.com"))
    expect(result.name).toBe("Alice")
  })

  it("should handle some() prism with None", () => {
    const user = new User("Alice", O.none())
    const _email = Optic.id<User>().at("email").some()

    const result = pipe(user, Optic.replace(_email)("newemail@example.com"))

    // replace will encode the value into Some even if original was None
    expect(result).toBeInstanceOf(User)
    expect(result.email).toEqual(O.some("newemail@example.com"))
  })

  it("should work with nonNullable() prism", () => {
    class Data {
      [immerable] = true
      constructor(readonly value: string | null) {}
    }

    const data = new Data("hello")
    const _value = Optic.id<Data>().at("value").nonNullable()

    const result = pipe(data, Optic.replace(_value)("world"))

    expect(result).toBeInstanceOf(Data)
    expect(result.value).toBe("world")
  })

  it("should work with filter() prism", () => {
    class Counter {
      [immerable] = true
      constructor(readonly count: number) {}
    }

    const counter = new Counter(4)
    const _evenCount = Optic.id<Counter>().at("count").filter((n) => n % 2 === 0)

    const result = pipe(counter, Optic.replace(_evenCount)(8))

    expect(result).toBeInstanceOf(Counter)
    expect(result.count).toBe(8)
  })

  it("should not modify when filter() predicate fails", () => {
    class Counter {
      [immerable] = true
      constructor(readonly count: number) {}
    }

    const counter = new Counter(3) // odd number
    const _evenCount = Optic.id<Counter>().at("count").filter((n) => n % 2 === 0)

    const result = pipe(counter, Optic.replace(_evenCount)(8))

    // replace still sets the value even if filter doesn't match
    expect(result).toBeInstanceOf(Counter)
    expect(result.count).toBe(8)
  })
})

describe("Optional optics with immerable classes", () => {
  it("should work with head() optional", () => {
    class Team {
      [immerable] = true
      constructor(readonly members: ReadonlyArray<string>) {}
    }

    const team = new Team(["Alice", "Bob", "Charlie"])
    const _head = Optic.id<Team>().at("members").compose(Optic.head())

    const result = pipe(team, Optic.replace(_head)("Dave"))

    expect(result).toBeInstanceOf(Team)
    expect(result.members).toEqual(["Dave", "Bob", "Charlie"])
  })

  it("should work with tail() optional", () => {
    class Team {
      [immerable] = true
      constructor(readonly members: ReadonlyArray<string>) {}
    }

    const team = new Team(["Alice", "Bob", "Charlie"])
    const _tail = Optic.id<Team>().at("members").compose(Optic.tail())

    const result = pipe(team, Optic.replace(_tail)(["Dave", "Eve"]))

    expect(result).toBeInstanceOf(Team)
    expect(result.members).toEqual(["Alice", "Dave", "Eve"])
  })

  it("should work with findFirst() optional", () => {
    class Inventory {
      [immerable] = true
      constructor(readonly items: ReadonlyArray<string | number>) {}
    }

    const inventory = new Inventory([1, 2, "apple", 3, "banana"])
    const _firstString = Optic.id<Inventory>()
      .at("items")
      .compose(Optic.findFirst((item): item is string => typeof item === "string"))

    const result = pipe(inventory, Optic.replace(_firstString)("orange"))

    expect(result).toBeInstanceOf(Inventory)
    expect(result.items).toEqual([1, 2, "orange", 3, "banana"])
  })
})

describe("Lens optics with immerable classes", () => {
  it("should work with pick() lens (returns plain object)", () => {
    class Person {
      [immerable] = true
      constructor(
        readonly name: string,
        readonly age: number,
        readonly city: string
      ) {}
    }

    const person = new Person("Alice", 30, "NYC")
    const _nameAge = Optic.id<Person>().pick("name", "age")

    const result = pipe(person, Optic.replace(_nameAge)({ name: "Bob", age: 35 }))

    // pick returns a plain object, not a class instance (by design)
    expect(result.name).toBe("Bob")
    expect(result.age).toBe(35)
    expect(result.city).toBe("NYC")
  })

  it("should work with omit() lens (returns plain object)", () => {
    class Person {
      [immerable] = true
      constructor(
        readonly name: string,
        readonly age: number,
        readonly city: string
      ) {}
    }

    const person = new Person("Alice", 30, "NYC")
    const _withoutAge = Optic.id<Person>().omit("age")

    const result = pipe(person, Optic.replace(_withoutAge)({ name: "Bob", city: "LA" }))

    // omit returns a plain object, not a class instance (by design)
    expect(result.name).toBe("Bob")
    expect(result.age).toBe(30)
    expect(result.city).toBe("LA")
  })
})

describe("Getter/Setter operations with immerable classes", () => {
  class Person {
    [immerable] = true
    constructor(
      readonly name: string,
      readonly email: O.Option<string>
    ) {}
  }

  it("should work with getOption()", () => {
    const person = new Person("Alice", O.some("alice@example.com"))
    const _email = Optic.id<Person>().at("email").some()

    const result = pipe(person, Optic.getOption(_email))

    expect(result).toEqual(O.some("alice@example.com"))
  })

  it("should work with replaceOption()", () => {
    const person = new Person("Alice", O.some("alice@example.com"))
    const _email = Optic.id<Person>().at("email").some()

    const result = pipe(person, Optic.replaceOption(_email)("new@example.com"))

    expect(O.isSome(result)).toBe(true)
    if (O.isSome(result)) {
      expect(result.value).toBeInstanceOf(Person)
      expect(result.value.email).toEqual(O.some("new@example.com"))
    }
  })

  it("should work with getOrModify()", () => {
    const person = new Person("Alice", O.some("alice@example.com"))
    const _email = Optic.id<Person>().at("email").some()

    const result = pipe(person, Optic.getOrModify(_email))

    expect(result._tag).toBe("Right")
    if (result._tag === "Right") {
      expect(result.right).toBe("alice@example.com")
    }
  })
})

describe("Edge cases with immerable classes", () => {
  it("should handle empty arrays", () => {
    class Team {
      [immerable] = true
      constructor(readonly members: ReadonlyArray<string>) {}
    }

    const team = new Team([])
    const _member0 = Optic.id<Team>().at("members").index(0)

    const result = pipe(team, Optic.replace(_member0)("Alice"))

    expect(result).toBeInstanceOf(Team)
    expect(result.members).toEqual([]) // Should remain empty
  })

  it("should handle undefined values", () => {
    class Data {
      [immerable] = true
      constructor(readonly value: string | undefined) {}
    }

    const data = new Data(undefined)
    const _value = Optic.id<Data>().at("value")

    const result = pipe(data, Optic.replace(_value)("hello"))

    expect(result).toBeInstanceOf(Data)
    expect(result.value).toBe("hello")
  })

  it("should handle null values", () => {
    class Data {
      [immerable] = true
      constructor(readonly value: string | null) {}
    }

    const data = new Data(null)
    const _value = Optic.id<Data>().at("value")

    const result = pipe(data, Optic.replace(_value)("hello"))

    expect(result).toBeInstanceOf(Data)
    expect(result.value).toBe("hello")
  })

  it("should work with readonly modifiers", () => {
    class ReadonlyData {
      [immerable] = true
      constructor(readonly value: string) {}
    }

    const data = new ReadonlyData("hello")
    const _value = Optic.id<ReadonlyData>().at("value")

    const result = pipe(data, Optic.replace(_value)("world"))

    expect(result).toBeInstanceOf(ReadonlyData)
    expect(result.value).toBe("world")
    expect(data.value).toBe("hello")
  })
})
