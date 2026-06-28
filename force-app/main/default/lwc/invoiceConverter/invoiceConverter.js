import { LightningElement, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import getInvoice from "@salesforce/apex/InvoiceConversionController.getInvoice";
import convertInvoice from "@salesforce/apex/InvoiceConversionController.convertInvoice";

import title from "@salesforce/label/c.FX_Invoice_Title";
import loading from "@salesforce/label/c.FX_Invoice_Loading";
import notFound from "@salesforce/label/c.FX_Invoice_Not_Found";
import convert from "@salesforce/label/c.FX_Invoice_Convert";
import amount from "@salesforce/label/c.FX_Invoice_Amount";
import baseAmount from "@salesforce/label/c.FX_Invoice_Base_Amount";
import rate from "@salesforce/label/c.FX_Invoice_Rate";
import rateDate from "@salesforce/label/c.FX_Invoice_Rate_Date";
import status from "@salesforce/label/c.FX_Invoice_Status";
import convertSuccess from "@salesforce/label/c.FX_Invoice_Convert_Success";
import convertError from "@salesforce/label/c.FX_Invoice_Convert_Error";
import unknownError from "@salesforce/label/c.FX_Invoice_Unknown_Error";

export default class InvoiceConverter extends LightningElement {
  @api recordId;

  invoice;
  errorMessage;
  isLoading = true;
  isConverting = false;
  wiredInvoiceResult;

  labels = {
    title,
    loading,
    notFound,
    convert,
    amount,
    baseAmount,
    rate,
    rateDate,
    status
  };

  @wire(getInvoice, { recordId: "$recordId" })
  wiredInvoice(result) {
    this.wiredInvoiceResult = result;
    const { data, error } = result;
    if (data !== undefined) {
      this.isLoading = false;
      this.invoice = data;
      this.errorMessage = undefined;
    } else if (error) {
      this.isLoading = false;
      this.invoice = undefined;
      this.errorMessage = this.reduceError(error);
    }
  }

  get hasError() {
    return !!this.errorMessage;
  }

  get isEmpty() {
    return !this.isLoading && !this.hasError && !this.invoice;
  }

  async handleConvert() {
    this.isConverting = true;
    try {
      this.invoice = await convertInvoice({ recordId: this.recordId });
      await refreshApex(this.wiredInvoiceResult);
      this.errorMessage = undefined;
      this.dispatchEvent(
        new ShowToastEvent({ title: convertSuccess, variant: "success" })
      );
    } catch (error) {
      this.errorMessage = this.reduceError(error);
      this.dispatchEvent(
        new ShowToastEvent({
          title: convertError,
          message: this.errorMessage,
          variant: "error"
        })
      );
    } finally {
      this.isConverting = false;
    }
  }

  reduceError(error) {
    return error && error.body && error.body.message
      ? error.body.message
      : unknownError;
  }
}
