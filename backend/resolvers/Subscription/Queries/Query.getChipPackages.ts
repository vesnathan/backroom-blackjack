import { Context } from "@aws-appsync/utils";
import { ChipPackageInfo } from "gqlTypes";

type CTX = Context<object, object, object, object, ChipPackageInfo[]>;

/**
 * Returns static chip package information - no database access needed.
 * Uses NoneDataSource.
 */
export function request(_ctx: CTX) {
  return { payload: null };
}

export function response(_ctx: CTX): ChipPackageInfo[] {
  const packages: ChipPackageInfo[] = [
    {
      __typename: "ChipPackageInfo",
      id: "chips_1000",
      chips: 1000,
      priceInCents: 1000,
      displayName: "1,000 Chips",
      popular: false,
    },
    {
      __typename: "ChipPackageInfo",
      id: "chips_5000",
      chips: 5000,
      priceInCents: 4500, // 10% discount
      displayName: "5,000 Chips",
      popular: true,
    },
    {
      __typename: "ChipPackageInfo",
      id: "chips_10000",
      chips: 10000,
      priceInCents: 8000, // 20% discount
      displayName: "10,000 Chips",
      popular: false,
    },
  ];

  return packages;
}
