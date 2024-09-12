define("NrbReleaseDetail", ["ConfigurationGrid", "ConfigurationGridGenerator",
	"ConfigurationGridUtilitiesV2", "NrbConst"], function(NrbConst) {
	return {
		entitySchemaName: "NrbRelease",
		messages: {
			/**
			 * Изменено состояние "Активно" публикации.
			 * @param {boolean} publicationIsActive
			 */
			"NrbPublicationActivityChanged": {
				mode: BPMSoft.MessageMode.BROADCAST,
				direction: BPMSoft.MessageDirectionType.SUBSCRIBE,
			},
		},
		attributes: {
			/**
			 * Редактируемый ли реестр.
			 */
			"IsEditable": {
				dataValueType: BPMSoft.DataValueType.BOOLEAN,
				type: BPMSoft.ViewModelColumnType.VIRTUAL_COLUMN,
				value: true
			}
		},
		mixins: {
			ConfigurationGridUtilitiesV2: "BPMSoft.ConfigurationGridUtilitiesV2"
		},
		methods: {
			onActiveRowAction: function(buttonTag, primaryColumnValue) {
				this.mixins.ConfigurationGridUtilitiesV2.onActiveRowAction.call(this, buttonTag, primaryColumnValue);
			},

			/**
			 * Запускается при загрузке информации в детали.
			 */
			onGridDataLoaded: function() {
				this.callParent(arguments);

				const isActiveColumn = "NrbIsActive";

				this.recolorGrid(
					this.sandbox.publish("GetColumnsValues", [isActiveColumn], [this.sandbox.id])[isActiveColumn]
				);

				this.sandbox.subscribe("NrbPublicationActivityChanged", this.recolorGrid, this);
			},

			/**
			 * Перекрасить строки/колонки детали.
			 * @param {boolean} publicationIsActive Активна ли публикация.
			 */
			recolorGrid: function(publicationIsActive) {
				if (Ext.isEmpty(this.getGridData())) {
					return;
				}

				const circulationColumn = "NrbCirculation";

				if (publicationIsActive) {
					BPMSoft.SysSettings.querySysSettingsItem(
						"NrbCirculationColorInActivePublication",
						function(color) {
							this.recolorGridColumn(circulationColumn, color);
						},
						this
					);
				} else {
					this.recolorGridColumn(circulationColumn, NrbConst.CirculationColor);
				}
			},

			/**
			 * Перекарсить колонку делатил
			 * @param {string} columnName Название колонки 
			 * @param {string} color Цвет
			 */
			recolorGridColumn: function(columnName, color) {
				const detailControl = document.getElementById("NrbReleaseDetailDetailControlGroup");

				const columns = detailControl.querySelectorAll(`[column-name=${columnName}`);

				columns.forEach(item =>{
					item.style.background = color;
				})
			}
		},
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "merge",
				"name": "DataGrid",
				"values": {
					"className": "BPMSoft.ConfigurationGrid",
					"generator": "ConfigurationGridGenerator.generatePartial",
					"generateControlsConfig": {"bindTo": "generateActiveRowControlsConfig"},
					"changeRow": {"bindTo": "changeRow"},
					"unSelectRow": {"bindTo": "unSelectRow"},
					"onGridClick": {"bindTo": "onGridClick"},
					"activeRowActions": [
						{
							"className": "BPMSoft.Button",
							"style": this.BPMSoft.controls.ButtonEnums.style.TRANSPARENT,
							"tag": "save",
							"markerValue": "save",
							"imageConfig": {"bindTo": "Resources.Images.SaveIcon"}
						},
						{
							"className": "BPMSoft.Button",
							"style": this.BPMSoft.controls.ButtonEnums.style.TRANSPARENT,
							"tag": "cancel",
							"markerValue": "cancel",
							"imageConfig": {"bindTo": "Resources.Images.CancelIcon"}
						},
						{
							"className": "BPMSoft.Button",
							"style": this.BPMSoft.controls.ButtonEnums.style.TRANSPARENT,
							"tag": "card",
							"markerValue": "card",
							"imageConfig": {"bindTo": "Resources.Images.CardIcon"}
						},
						{
							"className": "BPMSoft.Button",
							"style": BPMSoft.controls.ButtonEnums.style.TRANSPARENT,
							"tag": "copy",
							"markerValue": "copy",
							"imageConfig": {"bindTo": "Resources.Images.CopyIcon"}
						},
						{
							"className": "BPMSoft.Button",
							"style": this.BPMSoft.controls.ButtonEnums.style.TRANSPARENT,
							"tag": "remove",
							"markerValue": "remove",
							"imageConfig": {"bindTo": "Resources.Images.RemoveIcon"}
						}
					],
					"initActiveRowKeyMap": {"bindTo": "initActiveRowKeyMap"},
					"activeRowAction": {"bindTo": "onActiveRowAction"},
					"multiSelect": {"bindTo": "MultiSelect"}
				}
			}
		]/**SCHEMA_DIFF*/
	};
});