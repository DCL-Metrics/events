export type Configuration = {
  "explorer": {
    "minBuildNumber": number
  },
  "servers": {
    "contentWhitelist": string[]
  },
  "world": {
    "pois": {
      "x": number,
      "y": number
    }[]
  }
}

export type CommStatus = {
  "name": string,
  "version": string,
  "currenTime": number,
  "ready": boolean,
  "env": {
    "secure": boolean,
    "commitHash": string
  },
  "layers": {
    "name": string,
    "usersCount": number,
    "maxUsers": number,
    "usersParcels": [number, number][]
  }[]
}

export type Realm = {
  id: string,
  url: string,
  layers: string[]
}

export type CatalystNode = {
  domain: string
}

export type GraphResponse = {
  data: {
    nfts: {
      ens: {
        subdomain: string
      }
    }[]
  }
}