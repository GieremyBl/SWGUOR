declare module 'peru-utils' {
    export interface IUbigeo {
        code: string;
        name: string;
    }

    export interface IUbigeoDetails {
        code: string;
        department: string;
        province: string;
        district: string;
    }

    export interface IUbigeoFullDetails extends IUbigeoDetails {
        surfaceArea: string;
        latitude: string;
        longitude: string;
    }

    export interface IdUbigeo {
        id: string;
        reniec: string;
        inei: string;
    }

    export const ubigeoINEI: {
        getDepartments(): IUbigeo[];
        getProvince(code: string): (IUbigeo | undefined)[] | undefined;
        getDistrict(code: string): (IUbigeo | undefined)[] | undefined;
        getUbigeoDetails(code: string): IUbigeoDetails | undefined;
        getUbigeoFullDetails(code: string): IUbigeoFullDetails | undefined;
        getUbigeoCodeByDeparmentName(departmentName: string): IUbigeo | undefined;
        getUbigeoCodeByProvinceName(departmentName: string, provinceName: string): IUbigeo | undefined;
        getUbigeoCodeByDistrictName(departmentName: string, provinceName: string, districtName: string): IUbigeo | undefined;
        getUbigeoFullDetailsByDistrictName(departmentName: string, provinceName: string, districtName: string): IUbigeoFullDetails | undefined;
    };

    export const ubigeo: {
        findByIdUbigeo(id: string): IdUbigeo | undefined;
    };
}