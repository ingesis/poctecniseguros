sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.bancasegurosEmision.controller.Certificado", {
		handleRouteMatched: function(oEvent) {

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}

		},
		_onButtonPress: function() {
			var oView = this.getView();
			var oController = this;

			return new Promise(function(fnResolve, fnReject) {
				var oModel = oController.oModel;

				var fnResetChangesAndReject = function(sMessage) {
					oModel.resetChanges();
					fnReject(new Error(sMessage));
				};
				if (oModel && oModel.hasPendingChanges()) {
					oModel.submitChanges({
						success: function(oResponse) {
							var oBatchResponse = oResponse.__batchResponses[0];
							var oChangeResponse = oBatchResponse.__changeResponses && oBatchResponse.__changeResponses[0];
							if (oChangeResponse && oChangeResponse.data) {
								var sNewContext = oModel.getKey(oChangeResponse.data);
								oView.unbindObject();
								oView.bindObject({
									path: "/" + sNewContext
								});
								if (window.history && window.history.replaceState) {
									window.history.replaceState(undefined, undefined, window.location.hash.replace(encodeURIComponent(oController.sContext),
										encodeURIComponent(sNewContext)));
								}
								oModel.refresh();
								fnResolve();
							} else if (oChangeResponse && oChangeResponse.response) {
								fnResetChangesAndReject(oChangeResponse.message);
							} else if (!oChangeResponse && oBatchResponse.response) {
								fnResetChangesAndReject(oBatchResponse.message);
							} else {
								oModel.refresh();
								fnResolve();
							}
						},
						error: function(oError) {
							fnReject(new Error(oError.message));
						}
					});
				} else {
					fnResolve();
				}
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onLinkPress: function(oEvent) {

			var sDialogName = "Dialog1";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.bancasegurosEmision.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function() {

			this.mBindingOptions = {};
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Certificado").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			var oView = this.getView();
			oView.addEventDelegate({
				onBeforeShow: function() {
					if (sap.ui.Device.system.phone) {
						var oPage = oView.getContent()[0];
						if (oPage.getShowNavButton && !oPage.getShowNavButton()) {
							oPage.setShowNavButton(true);
							oPage.attachNavButtonPress(function() {
								this.oRouter.navTo("MenuBar", {}, true);
							}.bind(this));
						}
					}
				}.bind(this)
			});

			this.oModel = this.getOwnerComponent().getModel();

		}
	});
}, /* bExport= */ true);