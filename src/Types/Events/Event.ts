export class Event {

    private IsCanceled: boolean = false;

    public constructor(private name: string, private data: any, private IsCancelable: boolean) {

    }

    public getName(): string {
        return this.name;
    }

    public getRawData(): any {
        return this.data;
    }

    public isCancelable() {
        return this.IsCancelable;
    }

    public setCanceledValue(value: boolean) {
        this.IsCanceled = value;
    }

    public isCanceled() {
        return this.IsCanceled;
    }
}