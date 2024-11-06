export  interface User {
    id: number;
    email: string;
    password: string;
    address: string;
    firstName: string;
    lastName: string;
    pic:string
  }
 

  export interface Trips{
    id:number;
    userId: number;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }

export interface Steps {
  id: number;
  tripId: number;
  stepDate: Date;
  name:string;
  description: string;

}

export interface Comments {
  id: number;
  userId: number;
  stepId: number;
  comment: string;
}

export interface Photos {
  stepId: number;
  photoUrl: Buffer;
}

export interface NewPassword {
  password: string;
  new_password: string;
  repeat_password: string;
}

export interface LocationRequestBody {
  body: {
    latitude: number; 
    longitude: number;
    userId: number; 
    city: string;
  };
  city: string;
  userId: number;
  tripId: number;
}
